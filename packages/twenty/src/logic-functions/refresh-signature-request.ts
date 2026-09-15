import { isNonEmptyString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  LF_REFRESH_REQUEST_UNIVERSAL_IDENTIFIER,
  SG_STATUS_SIGNED,
  SR_STATUS_SENT,
} from 'src/constants/universal-identifiers';
import { readSignedSigners } from 'src/logic-functions/utils/read-signed-signers.util';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';
import {
  downloadSignedPdf,
  replaceSourceAttachment,
} from 'src/logic-functions/utils/signed-file.util';

export type RefreshResult = {
  success: boolean;
  signingUrl?: string;
  signerEmail?: string;
  error?: string;
};

/**
 * Re-reads a request from Autosignly and writes back who is up next.
 *
 * Two reasons this exists. A sandbox e-mails nobody, so after the first person
 * signs, the second has no way in unless the link is fetched; and a delivery
 * that never arrived — the relay was not running, the endpoint was down — would
 * otherwise leave the record frozen with no way to catch up.
 */
export const refreshSignatureRequestHandler = async (
  event: RoutePayload,
): Promise<RefreshResult> => {
  const body = event.body as { signatureRequestId?: string } | null;
  const signatureRequestId = body?.signatureRequestId;

  if (!signatureRequestId) {
    return { success: false, error: 'A signature request id is required.' };
  }

  const coreClient = new CoreApiClient();

  const { signatureRequests } = await coreClient.query({
    signatureRequests: {
      __args: { filter: { id: { eq: signatureRequestId } }, first: 1 },
      edges: {
        node: {
          id: true,
          name: true,
          autosignlyDocumentId: true,
          sourceAttachmentId: true,
        },
      },
    },
  });

  const request = signatureRequests?.edges?.[0]?.node;
  const autosignlyDocumentId = request?.autosignlyDocumentId;

  if (!autosignlyDocumentId) {
    return { success: false, error: 'This request was never sent to Autosignly.' };
  }

  const { documentSigners } = await coreClient.query({
    documentSigners: {
      __args: {
        filter: { signatureRequestId: { eq: signatureRequestId } },
        first: 50,
      },
      edges: { node: { email: true, status: true } },
    },
  });

  const pendingEmails = new Set(
    (documentSigners?.edges ?? []).flatMap((edge) => {
      const email = edge?.node?.email;

      return isNonEmptyString(email) && edge?.node?.status !== SG_STATUS_SIGNED
        ? [email.toLowerCase()]
        : [];
    }),
  );

  try {
    const document = await createAutosignlyClient().getDocument(
      autosignlyDocumentId,
    );

    const current = document.signers.find((signer) => signer.sandboxSignUrl);

    // Read from each signer's own signedAt rather than inferred from whose turn
    // it is: the turn is only knowable in a sandbox, where the link betrays it.
    const signed = readSignedSigners(document.signers, {
      signerEmail: null,
      occurredAt: null,
    });

    await Promise.all(
      signed.map(({ email, signedAt }) =>
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
            // Someone is still to sign, so the request is not finished,
            // whatever an earlier event may have written here.
            ...(current ? { status: SR_STATUS_SENT, completedAt: null } : {}),
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

    // Only when this refresh is the first thing to notice a signature: the
    // file is re-uploaded, so repeating it on every click would pile up a new
    // copy of the same PDF for nothing.
    const caughtUpOnASignature = signed.some(({ email }) =>
      pendingEmails.has(email.toLowerCase()),
    );

    if (caughtUpOnASignature && request?.sourceAttachmentId) {
      await replaceSourceAttachment({
        coreClient,
        attachmentId: request.sourceAttachmentId,
        signedPdf: await downloadSignedPdf(autosignlyDocumentId),
        documentName: request.name ?? 'signed-document',
      });
    }

    return {
      success: true,
      signingUrl: current?.sandboxSignUrl,
      signerEmail: current?.email,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Could not read the document.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_REFRESH_REQUEST_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-refresh-signature-request',
  description:
    'Re-reads a signature request from Autosignly and writes back the link of the signer whose turn it is.',
  timeoutSeconds: 30,
  handler: refreshSignatureRequestHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/refresh-request',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
