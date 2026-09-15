import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_RECORD_SIGNATURES_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type RecordContextObject } from 'src/logic-functions/utils/record-context.type';

export type SignatureSigner = {
  name: string;
  email: string;
  status: string;
  signingOrder: number | null;
  signedAt: string | null;
};

export type FileSignature = {
  attachmentId: string;
  fileName: string;
  requestId: string;
  requestName: string;
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  signingLink: string | null;
  signedDocumentUrl: string | null;
  signers: SignatureSigner[];
};

export type RecordSignaturesResult = {
  success: boolean;
  signatures?: FileSignature[];
  /** How many this record has in total, before the search narrows it. */
  totalCount?: number;
  hasNextPage?: boolean;
  endCursor?: string | null;
  error?: string;
};

const PAGE_SIZE = 20;

/**
 * Every signature request made from one record, with who has signed.
 *
 * The Files tab lists attachments without a word about their signatures, and
 * the relation field shows an identifier, so two files with the same name are
 * impossible to tell apart. This is the view that answers "where does this
 * document stand".
 */
export const listRecordSignaturesHandler = async (
  event: RoutePayload,
): Promise<RecordSignaturesResult> => {
  const body = event.body as {
    objectType?: RecordContextObject;
    recordId?: string;
    search?: string;
    after?: string;
  } | null;

  const objectType = body?.objectType ?? 'generic';
  const recordId = body?.recordId;
  const search = body?.search?.trim() ?? '';
  const after = body?.after;

  if (!recordId) {
    return { success: false, error: 'A record id is required.' };
  }

  const relationFilter =
    objectType === 'company'
      ? { companyId: { eq: recordId } }
      : objectType === 'opportunity'
        ? { opportunityId: { eq: recordId } }
        : { personId: { eq: recordId } };

  // Signers cannot be filtered on from here, so the search covers what the
  // request itself carries: the document name and the file it came from.
  const filter = search
    ? {
        and: [
          relationFilter,
          {
            or: [
              { name: { ilike: `%${search}%` } },
              { sourceFileName: { ilike: `%${search}%` } },
            ],
          },
        ],
      }
    : relationFilter;

  try {
    const { signatureRequests } = await new CoreApiClient().query({
      signatureRequests: {
        __args: {
          filter,
          orderBy: [{ createdAt: 'DescNullsLast' }],
          first: PAGE_SIZE,
          ...(after ? { after } : {}),
        },
        totalCount: true,
        pageInfo: { hasNextPage: true, endCursor: true },
        edges: {
          node: {
            id: true,
            name: true,
            status: true,
            sentAt: true,
            completedAt: true,
            sourceAttachmentId: true,
            sourceFileName: true,
            signingLink: { primaryLinkUrl: true },
            signedDocument: { label: true, url: true },
            signers: {
              __args: { first: 20 },
              edges: {
                node: {
                  name: true,
                  email: true,
                  status: true,
                  signingOrder: true,
                  signedAt: true,
                },
              },
            },
          },
        },
      },
    });

    const signatures = (signatureRequests?.edges ?? [])
      .map((edge) => {
        const node = edge?.node;

        if (!node?.id) {
          return null;
        }

        const signature: FileSignature = {
          attachmentId: node.sourceAttachmentId ?? '',
          fileName: node.sourceFileName || node.name || 'Document',
          requestId: node.id,
          requestName: node.name ?? '',
          status: node.status ?? '',
          sentAt: node.sentAt ?? null,
          completedAt: node.completedAt ?? null,
          signingLink: node.signingLink?.primaryLinkUrl || null,
          signedDocumentUrl: node.signedDocument?.[0]?.url ?? null,
          signers: (node.signers?.edges ?? [])
            .map((signerEdge) => signerEdge?.node)
            .filter((signer) => signer?.email)
            .map((signer) => ({
              name: signer?.name ?? '',
              email: signer?.email ?? '',
              status: signer?.status ?? '',
              signingOrder: signer?.signingOrder ?? null,
              signedAt: signer?.signedAt ?? null,
            }))
            .sort((left, right) => (left.signingOrder ?? 0) - (right.signingOrder ?? 0)),
        };

        return signature;
      })
      .filter((signature): signature is FileSignature => signature !== null);

    return {
      success: true,
      signatures,
      totalCount: signatureRequests?.totalCount ?? signatures.length,
      hasNextPage: signatureRequests?.pageInfo?.hasNextPage ?? false,
      endCursor: signatureRequests?.pageInfo?.endCursor ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not read the signatures of this record.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_RECORD_SIGNATURES_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-list-record-signatures',
  description: 'Signature requests made from one record, with signer progress.',
  timeoutSeconds: 20,
  handler: listRecordSignaturesHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/record-signatures',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
