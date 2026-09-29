import type { INodeProperties } from 'n8n-workflow';

const showOnlyForParty = {
	resource: ['party'],
};

export const partyOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: showOnlyForParty },
	default: 'create',
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Add a counterparty to this environment',
			action: 'Create a party',
		},
		{
			name: 'Delete',
			value: 'delete',
			description: 'Remove the party. Documents already signed keep their copy of the data.',
			action: 'Delete a party',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Get one party',
			action: 'Get a party',
		},
		{
			name: 'List',
			value: 'list',
			description: 'List counterparties in this environment, e.g. to prefill signers',
			action: 'List parties',
		},
		{
			name: 'Update',
			value: 'update',
			description: 'Replace the party data — every field is taken from this call, not only what changed',
			action: 'Update a party',
		},
	],
};

const CREATE_UPDATE_OPERATIONS = ['create', 'update'];

export const partyFields: INodeProperties[] = [
	// ---------------------------------------------------------------------
	// get / update / delete
	// ---------------------------------------------------------------------
	{
		displayName: 'Party ID',
		name: 'partyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForParty, operation: ['get', 'update', 'delete'] } },
	},

	// ---------------------------------------------------------------------
	// create / update
	// ---------------------------------------------------------------------
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: 'PERSON',
		required: true,
		displayOptions: { show: { ...showOnlyForParty, operation: CREATE_UPDATE_OPERATIONS } },
		options: [
			{ name: 'Person', value: 'PERSON' },
			{ name: 'Company', value: 'COMPANY' },
		],
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'Registered/company name, or the person\'s surname',
		displayOptions: { show: { ...showOnlyForParty, operation: CREATE_UPDATE_OPERATIONS } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { ...showOnlyForParty, operation: CREATE_UPDATE_OPERATIONS } },
		options: [
			{ displayName: 'Address City', name: 'city', type: 'string', default: '' },
			{
				displayName: 'Address Country Code',
				name: 'countryCode',
				type: 'string',
				default: '',
				placeholder: 'PL',
				description: 'ISO 3166-1 alpha-2. A Polish address makes the tax ID subject to the NIP checksum.',
			},
			{ displayName: 'Address Number', name: 'number', type: 'string', default: '' },
			{ displayName: 'Address Postal Code', name: 'postalCode', type: 'string', default: '' },
			{ displayName: 'Address Street', name: 'street', type: 'string', default: '' },
			{ displayName: 'Email', name: 'email', type: 'string', default: '', placeholder: 'name@email.com' },
			{ displayName: 'First Name', name: 'firstname', type: 'string', default: '', description: 'Required for a PERSON' },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
			{ displayName: 'Tax ID', name: 'taxId', type: 'string', default: '', description: 'Required for a COMPANY' },
		],
	},

	// ---------------------------------------------------------------------
	// list
	// ---------------------------------------------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { ...showOnlyForParty, operation: ['list'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...showOnlyForParty, operation: ['list'], returnAll: [false] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForParty, operation: ['list'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Matches a fragment of the name, given name, tax ID, email or phone',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Person', value: 'PERSON' },
					{ name: 'Company', value: 'COMPANY' },
				],
			},
		],
	},
];
