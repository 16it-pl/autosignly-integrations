import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { ROUTE_SEARCH_PEOPLE } from 'src/constants/route-paths.constant';
import { asRecord } from 'src/front-components/utils/as-record.util';
import { type SignerCandidate } from 'src/logic-functions/utils/record-context.type';

const DEBOUNCE_MS = 250;

/**
 * People matching what has been typed so far.
 *
 * Debounced because every keystroke would otherwise be a round trip, and a
 * stale response is discarded rather than allowed to overwrite a newer one.
 */
export const usePeopleSearch = (term: string) => {
  const [results, setResults] = useState<SignerCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (term.trim().length < 2) {
      setResults([]);
      setIsSearching(false);

      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const result = asRecord(
          await new RestApiClient().post(`/s${ROUTE_SEARCH_PEOPLE}`, {
            query: term,
          }),
        );

        if (!cancelled) {
          setResults((result.candidates as SignerCandidate[]) ?? []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  return { results, isSearching };
};
