import { CoreApiClient } from 'twenty-client-sdk/core';
import { type RoutePayload } from 'twenty-sdk/define';

import {
  SG_STATUS_DECLINED,
  SG_STATUS_SIGNED,
  SR_STATUS_COMPLETED,
  SR_STATUS_DECLINED,
  SR_STATUS_EXPIRED,
} from 'src/constants/universal-identifiers';
import {
  createAutosignlyClient,
  getWebhookSecret,
} from 'src/logic-functions/utils/create-autosignly-client.util';
import {
  classifyWebhookEvent,
  readWebhookEvent,
} from 'src/logic-functions/utils/read-webhook-event.util';
import { readSignedSigners } from 'src/logic-functions/utils/read-signed-signers.util';
import {
  downloadSignedPdf,
  replaceSourceAttachment,
  storeSignedDocumentOnRequest,
  waitForFinalSeal,
} from 'src/logic-functions/utils/signed-file.util';
import { verify } from '@16it/autosignly/webhooks';

export type WebhookHandlerResult = {
  success: boolean;
  outcome?: string;
  signatureRequestId?: string;
  error?: string;
};

type SignatureRequestRef = {
  id: string;
  name: string;
  sourceAttachmentId: string | null;
};

const findSignatureRequest = async (
  client: CoreApiClient,
  autosignlyDocumentId: string,
): Promise<SignatureRequestRef | null> => {
  const { signatureRequests } = await client.query({
    signatureRequests: {
      __args: {
        filter: { autosignlyDocumentId: { eq: autosignlyDocumentId } },
        first: 1,
      },
      edges: { node: { id: true, name: true, sourceAttachmentId: true } },
    },
  });

  const node = signatureRequests?.edges?.[0]?.node;

  return node?.id
    ? {
        id: node.id,
        name: node.name ?? 'signed-document',
        sourceAttachmentId: node.sourceAttachmentId ?? null,
      }
    : null;
};

// Kept out of the delivery's own success: Autosignly is the record of truth
// for the signature, and a storage hiccup in Twenty must not make the sender
// retry an event that has already been applied.
const syncSignedFile = async ({
  coreClient,
  signatureRequest,
  autosignlyDocumentId,
  isLastSignature,
}: {
  coreClient: CoreApiClient;
  signatureRequest: SignatureRequestRef;
  autosignlyDocumentId: string;
  isLastSignature: boolean;
}): Promise<void> => {
  try {
    if (isLastSignature) {
      await waitForFinalSeal(autosignlyDocumentId);
    }

    const signedPdf = await downloadSignedPdf(autosignlyDocumentId);

    if (isLastSignature) {
      await storeSignedDocumentOnRequest({
        coreClient,
        signatureRequestId: signatureRequest.id,
        signedPdf,
        documentName: signatureRequest.name,
      });
    }

    if (signatureRequest.sourceAttachmentId) {
      await replaceSourceAttachment({
        coreClient,
        attachmentId: signatureRequest.sourceAttachmentId,
        signedPdf,
        documentName: signatureRequest.name,
      });
    }
  } catch (error) {
    console.error(
      `[autosignly] could not write the signed file back for document ${autosignlyDocumentId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const autosignlyWebhookHandler = async (
  routePayload: RoutePayload<unknown>,
): Promise<WebhookHandlerResult> => {
  const rawBody = routePayload.rawBody;
  const signature = routePayload.headers?.['x-webhook-signature'];
  const timestamp = routePayload.headers?.['x-webhook-timestamp'];

  if (!rawBody || !signature || !timestamp) {
    return { success: false, error: 'Delivery is missing its signature headers.' };
  }

  // Verified before anything else happens: the resolver could not check it.
  try {
    verify(rawBody, signature, getWebhookSecret(), timestamp);
  } catch (error) {
    // Loud on purpose: the resolver already answered 200 to the sender, so a
    // rejection here is otherwise invisible. The usual cause is a signing key
    // belonging to a different environment than the API key in use.
    console.error(
      `[autosignly] webhook signature rejected: ${
        error instanceof Error ? error.message : String(error)
      }. Check that AUTOSIGNLY_WEBHOOK_SECRET belongs to the same environment as the API key.`,
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Webhook signature rejected.',
    };
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return { success: false, error: 'Delivery body is not valid JSON.' };
  }

  const event = readWebhookEvent(parsedBody);
  const outcome = classifyWebhookEvent(event.eventType);

  console.log(
    `[autosignly] webhook ${event.eventType} -> ${outcome}, documentId=${event.documentId ?? 'none'}`,
  );

  if (outcome === 'ignored') {
    return { success: true, outcome: `ignored:${event.eventType}` };
  }

  if (!event.documentId) {
    // Logged rather than thrown so one live delivery reveals the real field
    // name without every later delivery failing.
    console.warn(
      `[autosignly] no document id in a ${event.eventType} delivery; keys were ${Object.keys(
        (parsedBody ?? {}) as Record<string, unknown>,
      ).join(', ')}`,
    );

    return { success: false, error: 'Delivery carries no document id.' };
  }

  const coreClient = new CoreApiClient();
  const signatureRequest = await findSignatureRequest(
    coreClient,
    event.documentId,
  );

  if (!signatureRequest) {
    console.warn(
      `[autosignly] no signature request stores autosignlyDocumentId=${event.documentId}`,
    );

    return { success: true, outcome: 'ignored:unknown-document' };
  }

  const signatureRequestId = signatureRequest.id;

  if (outcome === 'signer-signed') {
    // One signature landed, the document is not done. Ask Autosignly who is up
    // next: a sandbox e-mails nobody, so the link it returns for the current
    // signer is the only way the next person gets in.
    const document = await createAutosignlyClient().getDocument(event.documentId);
    const current = document.signers.find((signer) => signer.sandboxSignUrl);

    await Promise.all(
      readSignedSigners(document.signers, event).map(({ email, signedAt }) =>
        coreClient.mutation({
          updateDocumentSigners: {
            __args: {
              filter: {
                signatureRequestId: { eq: signatureRequestId },
                email: { eq: email },
              },
              data: { status: SG_STATUS_SIGNED, signedAt },
            },
          },
        }),
      ),
    );

    await coreClient.mutation({
      updateSignatureRequest: {
        __args: {
          id: signatureRequestId,
          data: {
            signingLink: current?.sandboxSignUrl
              ? {
                  primaryLinkUrl: current.sandboxSignUrl,
                  primaryLinkLabel: `Sign as ${current.email ?? 'next signer'}`,
                }
              : null,
          },
        },
        id: true,
      },
    });

    await syncSignedFile({
      coreClient,
      signatureRequest,
      autosignlyDocumentId: event.documentId,
      isLastSignature: false,
    });

    return { success: true, outcome, signatureRequestId };
  }

  const status =
    outcome === 'completed'
      ? SR_STATUS_COMPLETED
      : outcome === 'declined'
        ? SR_STATUS_DECLINED
        : SR_STATUS_EXPIRED;

  await coreClient.mutation({
    updateSignatureRequest: {
      __args: {
        id: signatureRequestId,
        data: {
          status,
          completedAt: event.occurredAt ?? new Date().toISOString(),
        },
      },
      id: true,
    },
  });

  if (outcome === 'completed') {
    await coreClient.mutation({
      updateDocumentSigners: {
        __args: {
          filter: { signatureRequestId: { eq: signatureRequestId } },
          data: {
            status: SG_STATUS_SIGNED,
            signedAt: event.occurredAt ?? new Date().toISOString(),
          },
        },
      },
    });

    // The link is spent; leaving it on the record invites a pointless click.
    await coreClient.mutation({
      updateSignatureRequest: {
        __args: { id: signatureRequestId, data: { signingLink: null } },
        id: true,
      },
    });
  }

  if (outcome === 'declined') {
    await coreClient.mutation({
      updateDocumentSigners: {
        __args: {
          filter: { signatureRequestId: { eq: signatureRequestId } },
          data: { status: SG_STATUS_DECLINED },
        },
      },
    });
  }

  if (outcome === 'completed') {
    await syncSignedFile({
      coreClient,
      signatureRequest,
      autosignlyDocumentId: event.documentId,
      isLastSignature: true,
    });
  }

  return { success: true, outcome, signatureRequestId };
};
