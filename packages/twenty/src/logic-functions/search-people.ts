import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_SEARCH_PEOPLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type Edge } from 'src/logic-functions/utils/graphql-edge.type';
import { type SignerCandidate } from 'src/logic-functions/utils/record-context.type';
import {
  PERSON_CANDIDATE_SELECTION,
  type PersonShape,
  toSignerCandidate,
} from 'src/logic-functions/utils/to-signer-candidate.util';

const RESULT_LIMIT = 8;
const MINIMUM_TERM_LENGTH = 2;

export type SearchPeopleResult = {
  success: boolean;
  candidates?: SignerCandidate[];
  error?: string;
};

/**
 * People in the workspace matching a fragment of their name or e-mail.
 *
 * The signer often is not on the record being sent from — the other side of a
 * contract rarely is — and retyping somebody who already exists in the CRM
 * invites typos in the one field that decides where the document goes.
 */
export const searchPeopleHandler = async (
  event: RoutePayload,
): Promise<SearchPeopleResult> => {
  const body = event.body as { query?: string } | null;
  const term = body?.query?.trim() ?? '';

  if (term.length < MINIMUM_TERM_LENGTH) {
    return { success: true, candidates: [] };
  }

  const pattern = `%${term}%`;

  try {
    const { people } = await new CoreApiClient().query({
      people: {
        __args: {
          filter: {
            or: [
              { name: { firstName: { ilike: pattern } } },
              { name: { lastName: { ilike: pattern } } },
              { emails: { primaryEmail: { ilike: pattern } } },
            ],
          },
          first: RESULT_LIMIT,
        },
        edges: { node: PERSON_CANDIDATE_SELECTION },
      },
    });

    return {
      success: true,
      candidates: (people?.edges ?? [])
        .map((edge: Edge<PersonShape>) =>
          edge?.node ? toSignerCandidate(edge.node) : null,
        )
        .filter(
          (candidate: SignerCandidate | null): candidate is SignerCandidate =>
            candidate !== null,
        )
        // Without an address there is nowhere to send the document.
        .filter((candidate: SignerCandidate) => candidate.email.includes('@')),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Could not search people.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_SEARCH_PEOPLE_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-search-people',
  description: 'People matching a fragment of their name or email address.',
  timeoutSeconds: 15,
  handler: searchPeopleHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/search-people',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
