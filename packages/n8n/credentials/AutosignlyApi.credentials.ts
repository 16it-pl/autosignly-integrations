import { PRODUCTION_BASE_URL } from '@16it/autosignly';
import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class AutosignlyApi implements ICredentialType {
	name = 'autosignlyApi';

	displayName = 'Autosignly API';

	icon: Icon = { light: 'file:../icons/autosignly.svg', dark: 'file:../icons/autosignly.dark.svg' };

	documentationUrl = 'https://docs.16it.eu/docs/autosignly/integrations/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: PRODUCTION_BASE_URL,
			description:
				'The Autosignly API origin. Leave as the default for production, or point at a sandbox environment.',
		},
	];

	// The actual test — calling describeCredentials() to report which
	// environment (PROD/SANDBOX) the key resolves to — lives on the
	// Autosignly node's `methods.credentialTest.autosignlyApiTest`, referenced
	// from there via `testedBy`. n8n only allows a custom function-based
	// credential test to be registered on a node, not on the credential type
	// itself.
}
