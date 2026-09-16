import { randomUUID } from 'node:crypto';

import { defineLogicFunction } from 'twenty-sdk/define';
import { kv } from 'twenty-sdk/logic-function';

import { LF_REGISTER_WEBHOOK_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';
import { describeAutosignlyError } from 'src/logic-functions/utils/describe-autosignly-error.util';
import {
  getWebhookClaimKey,
  WEBHOOK_CLAIM_TOKEN_KV_KEY,
} from 'src/logic-functions/utils/get-webhook-claim-key.util';
import { getWebhookDestinationUrl } from 'src/logic-functions/utils/get-webhook-destination-url.util';

export type RegisterWebhookResult = {
  success: boolean;
  webhookUrl?: string;
  companyId?: string;
  environmentId?: string;
  environmentType?: string;
  isWebhookSecretSet?: boolean;
  error?: string;
};

export const registerWebhookHandler =
  async (): Promise<RegisterWebhookResult> => {
    const apiUrl = process.env.TWENTY_API_URL;

    if (!apiUrl) {
      return { success: false, error: 'TWENTY_API_URL is not available.' };
    }

    let credentials;

    try {
      credentials = await createAutosignlyClient().describeCredentials();
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? describeAutosignlyError(error)
            : 'Could not reach Autosignly with these credentials.',
      };
    }

    if (!credentials.valid) {
      return {
        success: false,
        error: 'Autosignly rejected this API key and secret.',
      };
    }

    // The token is minted once per workspace and then reused, so the URL the
    // user pasted into Autosignly keeps working across settings visits.
    let claimToken = await kv.get<string>(WEBHOOK_CLAIM_TOKEN_KV_KEY);

    if (!claimToken) {
      claimToken = randomUUID();
      await kv.set(WEBHOOK_CLAIM_TOKEN_KV_KEY, claimToken);
    }

    // A SERVER key can only be claimed by its owner workspace and is never
    // overwritten by another, so one tenant cannot hijack another's routing.
    try {
      await kv.set(getWebhookClaimKey(claimToken), null, { scope: 'SERVER' });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? `Could not claim the webhook route: ${error.message}`
            : 'Could not claim the webhook route.',
      };
    }

    return {
      success: true,
      webhookUrl: getWebhookDestinationUrl({ apiUrl, claimToken }),
      companyId: credentials.companyId,
      environmentId: credentials.environmentId,
      environmentType: credentials.environmentType,
      isWebhookSecretSet: Boolean(process.env.AUTOSIGNLY_WEBHOOK_SECRET),
    };
  };

export default defineLogicFunction({
  universalIdentifier: LF_REGISTER_WEBHOOK_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-register-webhook',
  description:
    'Validates the stored Autosignly credentials and returns the webhook URL to register in Autosignly.',
  timeoutSeconds: 30,
  handler: registerWebhookHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/register-webhook',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
