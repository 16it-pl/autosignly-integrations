import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type AppVariable } from 'src/front-components/types/application-variable.type';
import { shouldDisplayApplicationVariable } from 'src/front-components/utils/should-display-application-variable.util';

type AppVariablesState = {
  applicationId: string | undefined;
  applicationVariables: AppVariable[];
  isApplicationVariablesQueryLoading: boolean;
  errorMessage: string | undefined;
};

const ERROR_MESSAGE =
  'Could not read this application. Reload the page, and check the browser console if it persists.';

const LOADING_STATE: AppVariablesState = {
  applicationId: undefined,
  applicationVariables: [],
  isApplicationVariablesQueryLoading: true,
  errorMessage: undefined,
};

// The application is found by its own universalIdentifier rather than by asking
// which application owns this front component: `frontComponent(id:)` answers
// 403 on a settings panel, which left the whole panel showing an error.
export const useAppVariables = (): AppVariablesState => {
  const [state, setState] = useState<AppVariablesState>(LOADING_STATE);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const client = new MetadataApiClient();

        const { findManyApplications } = await client.query({
          findManyApplications: { id: true, universalIdentifier: true },
        });

        const applicationId = findManyApplications?.find(
          (application) =>
            application?.universalIdentifier ===
            APPLICATION_UNIVERSAL_IDENTIFIER,
        )?.id;

        if (!isNonEmptyString(applicationId)) {
          if (!cancelled) {
            setState({ ...LOADING_STATE, isApplicationVariablesQueryLoading: false, errorMessage: ERROR_MESSAGE });
          }

          return;
        }

        const { findOneApplication } = await client.query({
          findOneApplication: {
            __args: { id: applicationId },
            applicationVariables: {
              key: true,
              value: true,
              description: true,
              isSecret: true,
              isDeprecated: true,
            },
          },
        });

        if (cancelled) {
          return;
        }

        setState({
          applicationId,
          applicationVariables: [
            ...(findOneApplication?.applicationVariables ?? []),
          ]
            .filter(shouldDisplayApplicationVariable)
            .sort((left, right) => left.key.localeCompare(right.key)),
          isApplicationVariablesQueryLoading: false,
          errorMessage: undefined,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('[autosignly] could not read application variables', error);

        setState({
          ...LOADING_STATE,
          isApplicationVariablesQueryLoading: false,
          errorMessage: ERROR_MESSAGE,
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
