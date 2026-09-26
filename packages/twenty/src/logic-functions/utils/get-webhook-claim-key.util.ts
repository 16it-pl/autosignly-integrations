// One SERVER-scoped claim per workspace. The token travels in the webhook URL
// the user registers in Autosignly, so an inbound delivery can be routed back
// to the workspace that owns it without the payload carrying any Twenty id.
export const getWebhookClaimKey = (claimToken: string): string =>
  `autosignly-connection:${claimToken}`;

export const WEBHOOK_CLAIM_QUERY_PARAMETER = 'c';

export const WEBHOOK_CLAIM_TOKEN_KV_KEY = 'autosignly:webhook-claim-token';

// The signing key Autosignly hands back when this app registers the webhook.
// It lives here rather than in an application variable because a logic function
// cannot write one, and because a key this app issued for itself has no reason
// to travel to the browser.
export const WEBHOOK_SIGNING_KEY_KV_KEY = 'autosignly:webhook-signing-key';
