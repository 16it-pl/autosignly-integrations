import { PRODUCTION_BASE_URL } from '@16it/autosignly';
import type { IAuthenticateGeneric, ICredentialTestRequest, Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

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
				'The Autosignly API origin. Production vs. sandbox is decided entirely by which API Key/Secret ' +
				'pair you use above, not by this URL — leave it as the default. Only change it if Autosignly told ' +
				'you your company uses a different origin (e.g. a dedicated test environment); this is not the ' +
				'normal way to switch between production and sandbox.',
		},
	];

	// A function-based test (`methods.credentialTest` on a node, referenced
	// here via `testedBy`) would let a successful test report which
	// environment (PROD/SANDBOX) and company the key resolves to, by calling
	// describeCredentials(). That was the original design — until testing it
	// directly against a real n8n instance showed `testedBy` never resolves
	// for this package at all: with no declarative `test` below, n8n's
	// credential-test endpoint answers "No testing function found for this
	// credential" even though a node declares `testedBy` correctly. Verified
	// by removing `test`/`authenticate` and calling `/rest/credentials/test`
	// directly — not a guess. Whatever the exact cause (community-loaded node
	// types not being indexed the same way core ones are, most likely), the
	// declarative test below is the only mechanism that reliably works here,
	// at the cost of a generic pass/fail instead of a richer message.
	//
	// `/publics/v1/credentials` looks like the obvious endpoint for the test
	// below but must NOT be used: it deliberately never rejects a bad
	// key/secret pair, replying 200 with `{valid: false}` instead of 401, so
	// n8n would report an invalid credential as passing. `/sms-countries` is
	// a real, lightweight, parameter-free endpoint that genuinely 401s on bad
	// credentials (verified directly against the API).
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
				'X-API-SECRET': '={{$credentials.apiSecret}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/publics/v1/sms-countries',
			method: 'GET',
		},
	};
}
