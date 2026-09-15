import { AutosignlyClient } from '@16it/autosignly';

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

export const getWebhookSecret = (): string => {
  const secret = process.env.AUTOSIGNLY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      'AUTOSIGNLY_WEBHOOK_SECRET is not set. Register the webhook URL in Autosignly and paste the signing key back into the app settings.',
    );
  }

  return secret;
};
