import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { ROUTE_RECORD_CONTEXT } from 'src/constants/route-paths.constant';
import { asRecord } from 'src/front-components/utils/as-record.util';
import {
  type AttachmentOption,
  type RecordContextObject,
  type SignerCandidate,
} from 'src/logic-functions/utils/record-context.type';

type RecordContextState = {
  isLoading: boolean;
  attachments: AttachmentOption[];
  candidates: SignerCandidate[];
  recordName: string;
  error?: string;
};

export const useRecordContext = (
  objectType: RecordContextObject,
  recordId: string | null,
): RecordContextState => {
  const [state, setState] = useState<RecordContextState>({
    isLoading: true,
    attachments: [],
    candidates: [],
    recordName: '',
  });

  useEffect(() => {
    let cancelled = false;

    if (!recordId) {
      setState({
        isLoading: false,
        attachments: [],
        candidates: [],
        recordName: '',
        error: 'Select a single record first.',
      });

      return;
    }

    const load = async () => {
      try {
        const result = asRecord(
          await new RestApiClient().post(`/s${ROUTE_RECORD_CONTEXT}`, {
            objectType,
            recordId,
          }),
        );

        if (cancelled) {
          return;
        }

        setState({
          isLoading: false,
          attachments: (result.attachments as AttachmentOption[]) ?? [],
          candidates: (result.candidates as SignerCandidate[]) ?? [],
          recordName: (result.recordName as string) ?? '',
          error: result.success === false ? String(result.error) : undefined,
        });
      } catch (error) {
        if (!cancelled) {
          setState({
            isLoading: false,
            attachments: [],
            candidates: [],
            recordName: '',
            error:
              error instanceof Error ? error.message : 'Could not read the record.',
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [objectType, recordId]);

  return state;
};
