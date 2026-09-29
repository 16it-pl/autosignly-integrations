import { InvalidSignatureError, webhooks } from '@16it/autosignly';
import type {
	IDataObject,
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { getWebhookConfig, registerWebhook } from './webhookRegistration';

const SIGNATURE_HEADER = 'x-webhook-signature';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';
const STATIC_DATA_KEY = 'autosignlySigningKey';

export class AutosignlyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Autosignly Trigger',
		name: 'autosignlyTrigger',
		icon: { light: 'file:../../icons/autosignly.svg', dark: 'file:../../icons/autosignly.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '=Webhook',
		description: 'Starts a workflow when Autosignly delivers a document event',
		defaults: { name: 'Autosignly Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'autosignlyApi',
				required: true,
			},
			{
				name: 'autosignlyTriggerApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					"Activating this workflow registers this webhook with Autosignly automatically, using the Autosignly API credential above — nothing to copy or paste for a fresh environment. If Autosignly already has a different webhook URL configured, activation fails with an error explaining what to do: either update the URL in Autosignly's webhook settings to the one above, or manage it yourself by pasting a signing secret into the Autosignly Webhook Signing Key credential below (that credential, when filled in, always takes over from auto-registration). Autosignly currently sends DOCUMENT_SIGNED, DOCUMENT_ALL_SIGNATURES_DONE, DOCUMENT_CANCELLED and DOCUMENT_RESTORED — not DECLINED or EXPIRED, which it does not emit yet. DOCUMENT_ALL_SIGNATURES_DONE fires once the closing seal is applied, which is after the last signer signs, not at the same moment.",
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const manualSecret = await getManualSigningSecret(this);
				if (manualSecret) {
					// The user manages registration themselves — nothing for us to check.
					return true;
				}

				// No secret to verify with locally means `create` must run — even if
				// Autosignly's server reports this URL as already configured. Its
				// registration is permanent (see `create`), so relying on the server
				// side alone here would report "already fine" with no way to ever
				// obtain a usable secret again, stranding every future delivery.
				if (!getCachedSigningKey(this)) {
					return false;
				}

				const webhookUrl = this.getNodeWebhookUrl('default');
				try {
					const config = await getWebhookConfig(this);
					return Boolean(webhookUrl) && config.url === webhookUrl && config.hasActiveSigningKey;
				} catch (error) {
					// Reported, not thrown: `create` runs next and surfaces the same
					// problem as a real activation error instead of a debug log line.
					this.logger.debug('Could not read the current Autosignly webhook configuration', {
						error: error instanceof Error ? error.message : String(error),
					});
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const manualSecret = await getManualSigningSecret(this);
				if (manualSecret) {
					return true;
				}

				if (getCachedSigningKey(this)) {
					// A previous activation on this same workflow already registered
					// and cached a secret — reactivating (after Unpublish) must reuse
					// it rather than attempt to register again: Autosignly's
					// registration is permanent from its side, so a second attempt
					// would only fail with no way to recover a fresh secret anyway.
					return true;
				}

				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), "Could not determine this node's webhook URL");
				}

				const workflowId = this.getWorkflow().id ?? 'workflow';
				let result;
				try {
					result = await registerWebhook(this, webhookUrl, `n8n-${workflowId}`);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error);
				}

				if (result.alreadyRegistered) {
					throw new NodeOperationError(
						this.getNode(),
						"Autosignly already has a webhook registered for this environment, and its signing secret cannot be retrieved again through the API (this can happen if the workflow's saved data was lost, or another workflow/tool registered first). Generate a new signing key on Autosignly's webhook settings page and paste it into this node's Autosignly Webhook Signing Key credential — reactivating this workflow again will not help, since Autosignly's registration does not change.",
					);
				}

				this.getWorkflowStaticData('node')[STATIC_DATA_KEY] = result.signingKey;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				// Autosignly has no API to unregister a webhook, and its
				// registration is permanent from its side regardless — clearing the
				// secret cached here on Unpublish would only strand a later
				// reactivation with no way to recover it (see `create`). Nothing to
				// do; the cached secret is deliberately left in place.
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headerData = this.getHeaderData();

		const manualSecret = await getManualSigningSecret(this);
		const signingSecret = manualSecret || getCachedSigningKey(this);

		if (!signingSecret) {
			throw new NodeOperationError(
				this.getNode(),
				"No webhook signing secret available. Generate a new signing key on Autosignly's webhook settings page and paste it into the Autosignly Webhook Signing Key credential — this workflow's own auto-registration attempt did not leave a usable secret behind.",
			);
		}

		const signatureHeader = firstHeaderValue(headerData[SIGNATURE_HEADER]);
		const timestampHeader = firstHeaderValue(headerData[TIMESTAMP_HEADER]);

		if (!req.rawBody) {
			// n8n always captures the raw bytes of a webhook body into
			// `req.rawBody` before any JSON parsing — if it is missing here the
			// node is not wired up the way it expects, not something a signature
			// retry would fix.
			throw new NodeOperationError(
				this.getNode(),
				'No raw request body was available to verify the Autosignly webhook signature',
			);
		}

		try {
			webhooks.verify(req.rawBody, signatureHeader ?? '', signingSecret, timestampHeader ?? '');
		} catch (error) {
			if (error instanceof InvalidSignatureError) {
				this.getResponseObject().status(401).send('Unauthorized').end();
				return { noWebhookResponse: true };
			}
			throw new NodeOperationError(this.getNode(), error as Error);
		}

		const body = this.getBodyData() as IDataObject;

		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						body,
						headers: headerData as IDataObject,
					},
				]),
			],
		};
	}
}

/** The manually-pasted signing secret, if the optional credential is configured — always wins over auto-registration. */
async function getManualSigningSecret(context: IHookFunctions | IWebhookFunctions): Promise<string> {
	try {
		const credentials = await context.getCredentials('autosignlyTriggerApi');
		return String(credentials.signingSecret ?? '');
	} catch {
		return '';
	}
}

/**
 * The secret this node cached from its own auto-registration, if any. Kept
 * in workflow static data rather than a credential: nothing in n8n's node
 * API lets a webhook lifecycle method create or update a credential entry
 * (only read one), so static data — durable across restarts, though not
 * encrypted like the Credentials store — is the only persistence this node
 * itself can write to. `getManualSigningSecret` and its encrypted
 * credential remain the answer whenever that distinction matters.
 */
function getCachedSigningKey(context: IHookFunctions | IWebhookFunctions): string {
	const staticData = context.getWorkflowStaticData('node');
	return typeof staticData[STATIC_DATA_KEY] === 'string' ? (staticData[STATIC_DATA_KEY] as string) : '';
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}
