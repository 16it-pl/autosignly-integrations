import type { INodeProperties } from 'n8n-workflow';

const showOnlyForReference = {
	resource: ['reference'],
};

export const referenceOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: showOnlyForReference },
	default: 'getSignaturePolicy',
	options: [
		{
			name: 'Get Signature Policy',
			value: 'getSignaturePolicy',
			description: 'The signature types and verification methods allowed for a country',
			action: 'Get a signature policy',
		},
		{
			name: 'List SMS Countries',
			value: 'listSmsCountries',
			description: 'Countries an SMS verification code can be delivered to',
			action: 'List SMS countries',
		},
	],
};

export const referenceFields: INodeProperties[] = [
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'PL',
		description: 'ISO 3166-1 alpha-2. A country without its own rules gets the fallback policy, not an error.',
		displayOptions: { show: { ...showOnlyForReference, operation: ['getSignaturePolicy'] } },
	},
];
