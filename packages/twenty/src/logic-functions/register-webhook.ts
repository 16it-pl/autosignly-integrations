import { randomUUID } from 'node:crypto';

import { defineLogicFunction } from 'twenty-sdk/define';
import { kv, type RoutePayload } from 'twenty-sdk/logic-function';

import { LF_REGISTER_WEBHOOK_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  createAutosignlyClient,
  getWebhookSecret,
} from 'src/logic-functions/utils/create-autosignly-client.util';
import { describeAutosignlyError } from 'src/logic-functions/utils/describe-autosignly-error.util';
import {
  getWebhookClaimKey,
  WEBHOOK_CLAIM_TOKEN_KV_KEY,
  WEBHOOK_SIGNING_KEY_KV_KEY,
} from 'src/logic-functions/utils/get-webhook-claim-key.util';
import { getWebhookDestinationUrl } from 'src/logic-functions/utils/get-webhook-destination-url.util';
import {
  buildRelaySteps,
  isReachableFromInternet,
  type RelayStep,
} from 'src/logic-functions/utils/build-relay-steps.util';
import {
  isAlreadyRegistered,
  toRegistrableTarget,
} from 'src/logic-functions/utils/registration-decisions.util';

// The name the key is issued under, as it will read in the Autosignly panel.
const SIGNING_KEY_NAME = 'Twenty';

export type RegisterWebhookResult = {
  success: boolean;
  webhookUrl?: string;
  /** True when Autosignly holds no address and deliveries come through the relay. */
  isRelayOnly?: boolean;
  /** True when this press is what registered the webhook. */
  didRegister?: boolean;
  /** True when Autosignly already had a registration, so this one was refused. */
  wasAlreadyRegistered?: boolean;
  companyId?: string;
  environmentId?: string;
  environmentType?: string;
  isWebhookSecretSet?: boolean;
  relaySteps?: RelayStep[];
  error?: string;
};

export const registerWebhookHandler = async (
  event?: RoutePayload,
): Promise<RegisterWebhookResult> => {
    // Opening the screen only reports where things stand. Registering is a
    // press, because Autosignly grants one registration per environment and
    // there is no way to take it back from here.
    const shouldRegister =
      (event?.body as { register?: boolean } | null)?.register === true;
    const apiUrl = process.env.TWENTY_API_URL;

    if (!apiUrl) {
      return { success: false, error: 'TWENTY_API_URL is not available.' };
    }

    let claimToken = await kv.get<string>(WEBHOOK_CLAIM_TOKEN_KV_KEY);

    if (!claimToken) {
      claimToken = randomUUID();
      await kv.set(WEBHOOK_CLAIM_TOKEN_KV_KEY, claimToken);
    }

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

    const webhookUrl = getWebhookDestinationUrl({ apiUrl, claimToken });
    const relaySteps = isReachableFromInternet(webhookUrl)
      ? []
      : buildRelaySteps({ webhookUrl, apiUrl: process.env.AUTOSIGNLY_API_URL });
    const setup = {
      webhookUrl,
      relaySteps,
      isWebhookSecretSet: await hasSigningKey(),
    };

    let credentials;

    try {
      credentials = await createAutosignlyClient().describeCredentials();
    } catch (error) {
      return {
        ...setup,
        success: false,
        error:
          error instanceof Error
            ? describeAutosignlyError(error)
            : 'Could not reach Autosignly with these credentials.',
      };
    }

    if (!credentials.valid) {
      return {
        ...setup,
        success: false,
        error: 'Autosignly rejected this API key and secret.',
      };
    }

    const identity = {
      companyId: credentials.companyId,
      environmentId: credentials.environmentId,
      environmentType: credentials.environmentType,
    };

    const client = createAutosignlyClient();

    if (!shouldRegister) {
      const existing = await readExistingRegistration(client);

      return {
        ...setup,
        ...identity,
        success: true,
        wasAlreadyRegistered: existing?.isRegistered ?? false,
        isRelayOnly: existing?.isRelayOnly,
      };
    }

    const target = toRegistrableTarget(webhookUrl);

    try {
      const registered = await client.registerWebhook({
        keyName: SIGNING_KEY_NAME,
        url: target,
      });

      await kv.set(WEBHOOK_SIGNING_KEY_KV_KEY, registered.signingKey);

      return {
        ...setup,
        ...identity,
        success: true,
        didRegister: true,
        isRelayOnly: !registered.url,
        isWebhookSecretSet: true,
      };
    } catch (error) {
      // Autosignly allows one registration per environment, so a second press,
      // or a workspace whose company was set up from the panel, lands here. The
      // credentials are fine; only the registration is unavailable.
      if (isAlreadyRegistered(error)) {
        const existing = await readExistingRegistration(client);

        return {
          ...setup,
          ...identity,
          success: true,
          wasAlreadyRegistered: true,
          isRelayOnly: existing?.isRelayOnly ?? !target,
          isWebhookSecretSet: await hasSigningKey(),
        };
      }

      return {
        ...setup,
        ...identity,
        success: false,
        error:
          error instanceof Error
            ? describeAutosignlyError(error)
            : 'Could not register the webhook in Autosignly.',
      };
    }
  };


const readExistingRegistration = async (
  client: ReturnType<typeof createAutosignlyClient>,
): Promise<{ isRegistered: boolean; isRelayOnly: boolean } | undefined> => {
  try {
    const configuration = await client.getWebhookConfiguration();

    return {
      isRegistered: Boolean(configuration.url) || configuration.keys.length > 0,
      isRelayOnly: !configuration.url,
    };
  } catch {
    return undefined;
  }
};

const hasSigningKey = async (): Promise<boolean> => {
  try {
    return Boolean(await getWebhookSecret());
  } catch {
    return false;
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_REGISTER_WEBHOOK_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-register-webhook',
  description:
    'Checks the stored Autosignly credentials and registers this workspace for webhook deliveries.',
  timeoutSeconds: 30,
  handler: registerWebhookHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/register-webhook',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
