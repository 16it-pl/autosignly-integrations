import { type CoreApiClient } from 'twenty-client-sdk/core';

import {
  SR_STATUS_PENDING,
  SR_STATUS_SENT,
} from 'src/constants/universal-identifiers';

/** Statuses in which a request is still waiting for somebody to act. */
export const OPEN_STATUSES = [SR_STATUS_PENDING, SR_STATUS_SENT] as const;

/**
 * Signature requests still awaiting signatures, keyed by the attachment they
 * were sent from.
 *
 * Sending the same file again while the first request is open would leave two
 * live links for one document and two rows claiming to be the truth, so the
 * form marks those attachments and the send refuses them.
 */
export const findOpenRequestsByAttachment = async (
  client: CoreApiClient,
  attachmentIds: string[],
): Promise<Map<string, string>> => {
  const byAttachment = new Map<string, string>();

  if (attachmentIds.length === 0) {
    return byAttachment;
  }

  const { signatureRequests } = await client.query({
    signatureRequests: {
      __args: {
        filter: {
          sourceAttachmentId: { in: attachmentIds },
          status: { in: [...OPEN_STATUSES] },
        },
        first: 200,
      },
      edges: { node: { id: true, sourceAttachmentId: true } },
    },
  });

  for (const edge of signatureRequests?.edges ?? []) {
    const node = edge?.node;

    if (node?.id && node.sourceAttachmentId) {
      byAttachment.set(node.sourceAttachmentId, node.id);
    }
  }

  return byAttachment;
};
