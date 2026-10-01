import { AutosignlyClient } from '@16it/autosignly';
import { kv } from 'twenty-sdk/logic-function';

import { WEBHOOK_SIGNING_KEY_KV_KEY } from 'src/logic-functions/utils/get-webhook-claim-key.util';

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      'Autosignly is not configured. Add the API key and secret in Settings, Applications, Autosignly.',
    );
    this.name = 'MissingCredentialsError';
  }
}

// Credentials live in secret application variables, which the platform injects
// into logic functions only. They must never reach a front component.
export const createAutosignlyClient = (): AutosignlyClient => {
  const apiKey = process.env.AUTOSIGNLY_API_KEY;
  const apiSecret = process.env.AUTOSIGNLY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new MissingCredentialsError();
  }

  // No default of our own: the client already knows its production host and
  // appends the /publics/v1 prefix itself, so an override here must be the
  // bare origin plus /api, not the versioned path.
  const baseUrl = process.env.AUTOSIGNLY_API_URL?.trim();

  return new AutosignlyClient(
    apiKey,
    apiSecret,
    baseUrl ? { baseUrl } : {},
  );
};

// A pasted key wins over the one this app stored for itself. Rotating the key
// in the Autosignly panel is the only way to replace it, because registration
// is granted once per environment and cannot be repeated from here.
export const getWebhookSecret = async (): Promise<string> => {
  const pasted = process.env.AUTOSIGNLY_WEBHOOK_SECRET?.trim();

  if (pasted) {
    return pasted;
  }

  const registered = (await kv.get<string>(WEBHOOK_SIGNING_KEY_KV_KEY))?.trim();

  if (!registered) {
    throw new Error(
      'No webhook signing key. Press "Check and register" in the app settings, or paste a key from the Autosignly panel.',
    );
  }

  return registered;
};
