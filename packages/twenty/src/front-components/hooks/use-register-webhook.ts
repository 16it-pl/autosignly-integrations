import { useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { ROUTE_REGISTER_WEBHOOK } from 'src/constants/route-paths.constant';
import { asRecord } from 'src/front-components/utils/as-record.util';
import { type RelayStep } from 'src/logic-functions/utils/build-relay-steps.util';

export type WebhookRegistration = {
  success: boolean;
  webhookUrl?: string;
  isRelayOnly?: boolean;
  didRegister?: boolean;
  wasAlreadyRegistered?: boolean;
  companyId?: string;
  environmentId?: string;
  environmentType?: string;
  isWebhookSecretSet?: boolean;
  relaySteps?: RelayStep[];
  error?: string;
};

export const useRegisterWebhook = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registration, setRegistration] = useState<
    WebhookRegistration | undefined
  >();

  // `register: false` only reports where things stand, which is what opening
  // the screen does. The button is what actually registers.
  const registerWebhook = async (register = true): Promise<void> => {
    setIsRegistering(true);

    try {
      const client = new RestApiClient();
      const result = asRecord(
        await client.post(`/s${ROUTE_REGISTER_WEBHOOK}`, { register }),
      );

      setRegistration(result as WebhookRegistration);
    } catch (error) {
      setRegistration({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not reach the Autosignly app function.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return { registerWebhook, isRegistering, registration };
};
