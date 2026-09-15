import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_LIST_RECORD_CONTEXT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { findOpenRequestsByAttachment } from 'src/logic-functions/utils/open-signature-requests.util';
import {
  type AttachmentOption,
  type RecordContextObject,
  type RecordContextResult,
  type SignerCandidate,
} from 'src/logic-functions/utils/record-context.type';
import {
  PERSON_CANDIDATE_SELECTION,
  toSignerCandidate,
} from 'src/logic-functions/utils/to-signer-candidate.util';

const SIGNABLE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif'];

const isSignable = (extension: string | null): boolean =>
  !extension || SIGNABLE_EXTENSIONS.includes(extension.replace('.', '').toLowerCase());

const loadAttachments = async (
  client: CoreApiClient,
  objectType: RecordContextObject,
  recordId: string,
): Promise<AttachmentOption[]> => {
  const filterKey =
    objectType === 'company'
      ? 'targetCompanyId'
      : objectType === 'opportunity'
        ? 'targetOpportunityId'
        : 'targetPersonId';

  const { attachments } = await client.query({
    attachments: {
      __args: { filter: { [filterKey]: { eq: recordId } }, first: 60 },
      edges: {
        node: {
          id: true,
          name: true,
          file: { fileId: true, label: true, extension: true, url: true },
        },
      },
    },
  });

  return (attachments?.edges ?? [])
    .map((edge) => {
      const node = edge?.node;
      const file = node?.file?.[0];

      if (!node?.id || !file?.url) {
        return null;
      }

      const extension = file.extension ?? null;

      const option: AttachmentOption = {
        id: node.id,
        name: node.name ?? file.label ?? 'Attachment',
        fileUrl: file.url,
        extension,
        openSignatureRequestId: null,
      };

      return option;
    })
    .filter((option): option is AttachmentOption => option !== null)
    .filter((option) => isSignable(option.extension));
};

const loadCandidates = async (
  client: CoreApiClient,
  objectType: RecordContextObject,
  recordId: string,
): Promise<{ recordName: string; candidates: SignerCandidate[] }> => {
  if (objectType === 'person') {
    const { people } = await client.query({
      people: {
        __args: { filter: { id: { eq: recordId } }, first: 1 },
        edges: { node: PERSON_CANDIDATE_SELECTION },
      },
    });

    const person = people?.edges?.[0]?.node;
    const candidate = person ? toSignerCandidate(person) : null;

    return {
      recordName: [candidate?.firstName, candidate?.lastName]
        .filter(Boolean)
        .join(' '),
      candidates: candidate ? [candidate] : [],
    };
  }

  if (objectType === 'company') {
    const { companies } = await client.query({
      companies: {
        __args: { filter: { id: { eq: recordId } }, first: 1 },
        edges: {
          node: {
            id: true,
            name: true,
            people: {
              __args: { first: 30 },
              edges: { node: PERSON_CANDIDATE_SELECTION },
            },
          },
        },
      },
    });

    const company = companies?.edges?.[0]?.node;

    return {
      recordName: company?.name ?? '',
      candidates: (company?.people?.edges ?? [])
        .map((edge) => (edge?.node ? toSignerCandidate(edge.node) : null))
        .filter((candidate): candidate is SignerCandidate => candidate !== null),
    };
  }

  if (objectType === 'opportunity') {
    const { opportunities } = await client.query({
      opportunities: {
        __args: { filter: { id: { eq: recordId } }, first: 1 },
        edges: {
          node: {
            id: true,
            name: true,
            pointOfContact: PERSON_CANDIDATE_SELECTION,
            company: {
              id: true,
              name: true,
              people: {
                __args: { first: 30 },
                edges: { node: PERSON_CANDIDATE_SELECTION },
              },
            },
          },
        },
      },
    });

    const opportunity = opportunities?.edges?.[0]?.node;
    const pointOfContact = opportunity?.pointOfContact
      ? toSignerCandidate(opportunity.pointOfContact)
      : null;

    // The point of contact is the natural signer; when it is empty we fall
    // back to everyone at the company rather than showing an empty form.
    const candidates = pointOfContact
      ? [pointOfContact]
      : (opportunity?.company?.people?.edges ?? [])
          .map((edge) => (edge?.node ? toSignerCandidate(edge.node) : null))
          .filter(
            (candidate): candidate is SignerCandidate => candidate !== null,
          );

    return { recordName: opportunity?.name ?? '', candidates };
  }

  return { recordName: '', candidates: [] };
};

export const listRecordContextHandler = async (
  event: RoutePayload,
): Promise<RecordContextResult> => {
  const body = event.body as {
    objectType?: RecordContextObject;
    recordId?: string;
  } | null;

  const objectType = body?.objectType ?? 'generic';
  const recordId = body?.recordId;

  if (!recordId) {
    return { success: false, error: 'A record id is required.' };
  }

  if (objectType === 'generic') {
    return { success: true, recordName: '', attachments: [], candidates: [] };
  }

  try {
    const client = new CoreApiClient();
    const [attachments, { recordName, candidates }] = await Promise.all([
      loadAttachments(client, objectType, recordId),
      loadCandidates(client, objectType, recordId),
    ]);

    // Flagged rather than hidden: the form still shows the file, greyed out and
    // saying why, which is less confusing than an attachment that vanished.
    const openRequests = await findOpenRequestsByAttachment(
      client,
      attachments.map((attachment) => attachment.id),
    );

    return {
      success: true,
      recordName,
      attachments: attachments.map((attachment) => ({
        ...attachment,
        openSignatureRequestId: openRequests.get(attachment.id) ?? null,
      })),
      candidates,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not read the record context.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_LIST_RECORD_CONTEXT_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-list-record-context',
  description:
    'Attachments that can be signed and people who could sign them, for one record.',
  timeoutSeconds: 20,
  handler: listRecordContextHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/record-context',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
