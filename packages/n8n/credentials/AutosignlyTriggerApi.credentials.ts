import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

// There is nothing to call to test this credential: it is an HMAC signing
// secret, not an API key, and Autosignly has no endpoint that would confirm
// one is correct short of a live webhook delivery.
// eslint-disable-next-line @n8n/community-nodes/credential-test-required
export class AutosignlyTriggerApi implements ICredentialType {
	name = 'autosignlyTriggerApi';

	displayName = 'Autosignly Webhook Signing Key API';

	icon: Icon = { light: 'file:../icons/autosignly.svg', dark: 'file:../icons/autosignly.dark.svg' };

	documentationUrl = 'https://docs.16it.eu/docs/autosignly/integrations/api';

	properties: INodeProperties[] = [
		{
			displayName: 'Signing Secret',
			name: 'signingSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'The signing secret Autosignly generated for this webhook. Copy it from the Autosignly application when you paste the n8n webhook URL there — it is not the API key/secret pair used by the Autosignly node.',
		},
	];
}
