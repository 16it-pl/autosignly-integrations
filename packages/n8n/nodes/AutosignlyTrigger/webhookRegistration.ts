import type { IHookFunctions } from 'n8n-workflow';

/**
 * Talks directly to Autosignly's `/publics/v1/webhooks` endpoint rather than
 * going through `@16it/autosignly`: the SDK (still at 1.0.2 as of writing)
 * does not expose this yet. Replace with the SDK client once it does.
 */

const ALL_EVENTS = [
	'DOCUMENT_SIGNED',
	'DOCUMENT_ALL_SIGNATURES_DONE',
	'DOCUMENT_CANCELLED',
	'DOCUMENT_RESTORED',
];

export interface WebhookConfig {
	url: string | null;
	events: string[];
	hasActiveSigningKey: boolean;
}

export interface RegisterWebhookSuccess {
	alreadyRegistered: false;
	signingKey: string;
}

export interface RegisterWebhookConflict {
	alreadyRegistered: true;
}

async function autosignlyFetch(
	context: IHookFunctions,
	path: string,
	init: { method?: string; body?: unknown } = {},
): Promise<Response> {
	const credentials = await context.getCredentials('autosignlyApi');
	const baseUrl = String(credentials.baseUrl || 'https://app.autosignly.eu/api').replace(/\/+$/, '');

	return fetch(`${baseUrl}/publics/v1${path}`, {
		method: init.method ?? 'GET',
		headers: {
			'X-API-KEY': String(credentials.apiKey),
			'X-API-SECRET': String(credentials.apiSecret),
			Accept: 'application/json',
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
		},
		body: init.body ? JSON.stringify(init.body) : undefined,
	});
}

/** The webhook URL and events currently configured for this environment, if any. */
export async function getWebhookConfig(context: IHookFunctions): Promise<WebhookConfig> {
	const response = await autosignlyFetch(context, '/webhooks');
	if (!response.ok) {
		throw new Error(`Could not read the webhook configuration: HTTP ${response.status}`);
	}
	return (await response.json()) as WebhookConfig;
}

/**
 * Registers this URL as the environment's webhook and returns the signing
 * key Autosignly generates for it — visible in this response only, never
 * again afterwards.
 *
 * Registration works once per environment. A second attempt — from this
 * node or anything else, including a manual setup in Autosignly's own UI —
 * answers 409 `WEBHOOK_ALREADY_REGISTERED` with no secret to recover.
 */
export async function registerWebhook(
	context: IHookFunctions,
	url: string,
	keyName: string,
): Promise<RegisterWebhookSuccess | RegisterWebhookConflict> {
	const response = await autosignlyFetch(context, '/webhooks', {
		method: 'POST',
		body: { url, events: ALL_EVENTS, keyName },
	});

	if (response.status === 409) {
		return { alreadyRegistered: true };
	}
	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`Could not register the webhook: HTTP ${response.status} ${text}`.trim());
	}

	const body = (await response.json()) as { signingKey: string };
	return { alreadyRegistered: false, signingKey: body.signingKey };
}
