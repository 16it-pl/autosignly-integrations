import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocument = {
	resource: ['document'],
};

const SEND_OPERATIONS = ['sendForSignature', 'sendExisting'];

export const documentOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: showOnlyForDocument },
	default: 'sendForSignature',
	options: [
		{
			name: 'Download',
			value: 'download',
			description: "Download a document's current file as binary data",
			action: 'Download a document',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Fetch a document, its signers and a link to its current file',
			action: 'Get a document',
		},
		{
			name: 'List',
			value: 'list',
			description: 'List documents in this environment',
			action: 'List documents',
		},
		{
			name: 'Send Existing Document for Signature',
			value: 'sendExisting',
			description: 'Send a previously uploaded document (e.g. one with attachments) to signers',
			action: 'Send an existing document for signature',
		},
		{
			name: 'Send for Signature',
			value: 'sendForSignature',
			description: 'Upload a PDF and send it to one or more signers in one call',
			action: 'Send a document for signature',
		},
		{
			name: 'Upload',
			value: 'upload',
			description: 'Store a PDF as a document without sending it — add attachments to it first, then send it',
			action: 'Upload a document',
		},
	],
};

const signersField: INodeProperties = {
	displayName: 'Signers',
	name: 'signers',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true, sortable: true },
	placeholder: 'Add Signer',
	default: {},
	required: true,
	displayOptions: { show: { ...showOnlyForDocument, operation: SEND_OPERATIONS } },
	options: [
		{
			displayName: 'Signer',
			name: 'signer',
			values: [
				{
					displayName: 'Country',
					name: 'country',
					type: 'string',
					default: '',
					required: true,
					placeholder: 'PL',
					description: 'ISO 3166-1 alpha-2 country code — decides the applicable signature policy',
				},
				{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '', required: true },
				{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', required: true },
				{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', required: true },
				{ displayName: 'Locale', name: 'locale', type: 'string', default: '', placeholder: 'pl-PL' },
				{
					displayName: 'Phone Number',
					name: 'phoneNumber',
					type: 'string',
					default: '',
					placeholder: '+48123456789',
					description: 'E.164 format. Required when this signer is verified by SMS.',
				},
				{
					displayName: 'Signature Type Name or ID',
					name: 'signatureType',
					type: 'options',
					default: '',
					description: 'Leave as "Default" to use the Signature Type from Additional Fields (or Autosignly\'s own SES default) for this signer. Loaded from Autosignly\'s signature policy for the Country above. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					typeOptions: {
						loadOptionsMethod: 'getSignatureTypesForSigner',
						loadOptionsDependsOn: ['&country'],
					},
				},
				{
					displayName: 'Signature Verification Method Name or ID',
					name: 'signatureVerificationMethod',
					type: 'options',
					default: '',
					description: 'Leave as "Default" to use the Verification Method from Additional Fields for this signer. Loaded from Autosignly\'s signature policy for the Country and Signature Type above. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					displayOptions: { show: { signatureType: ['AES'] } },
					typeOptions: {
						loadOptionsMethod: 'getVerificationMethodsForSigner',
						loadOptionsDependsOn: ['&country', '&signatureType'],
					},
				},
				{
					displayName: 'Signing Order',
					name: 'order',
					type: 'number',
					default: 1,
					description: 'Signers are notified in this order, starting at 1',
				},
			],
		},
	],
};

const additionalSendFieldsField: INodeProperties = {
	displayName: 'Additional Fields',
	name: 'additionalFields',
	type: 'collection',
	placeholder: 'Add Field',
	default: {},
	displayOptions: { show: { ...showOnlyForDocument, operation: SEND_OPERATIONS } },
	options: [
		{ displayName: 'Initiator Email', name: 'initiatorEmail', type: 'string', default: '' },
		{ displayName: 'Initiator Locale', name: 'initiatorLocale', type: 'string', default: '', placeholder: 'pl-PL' },
		{
			displayName: 'Signature Mode',
			name: 'signatureMode',
			type: 'options',
			default: 'STAMP',
			options: [
				{ name: 'Stamp', value: 'STAMP' },
				{ name: 'Signatures Card', value: 'SIGNATURES_CARD' },
			],
		},
		{
			displayName: 'Signature Type',
			name: 'signatureType',
			type: 'options',
			default: 'SES',
			description: 'Applies to every signer unless overridden on the signer itself',
			options: [
				{ name: 'Simple (SES)', value: 'SES' },
				{ name: 'Advanced (AES)', value: 'AES' },
				{ name: 'Qualified (QES)', value: 'QES' },
			],
		},
		{
			displayName: 'Verification Method',
			name: 'verificationMethod',
			type: 'options',
			default: 'SMS',
			displayOptions: { show: { signatureType: ['AES'] } },
			options: [
				{ name: 'SMS', value: 'SMS' },
				{ name: 'Bank / National ID (WK)', value: 'WK' },
			],
		},
	],
};

export const documentFields: INodeProperties[] = [
	// ---------------------------------------------------------------------
	// sendForSignature / upload
	// ---------------------------------------------------------------------
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the input item field that contains the PDF to send',
		displayOptions: { show: { ...showOnlyForDocument, operation: ['sendForSignature', 'upload'] } },
	},
	{
		displayName: 'Document Name',
		name: 'documentName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForDocument, operation: ['sendForSignature', 'upload'] } },
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'document.pdf',
		description: 'Defaults to the binary field\'s own file name, or "document.pdf"',
		displayOptions: { show: { ...showOnlyForDocument, operation: ['sendForSignature', 'upload'] } },
	},

	// ---------------------------------------------------------------------
	// sendExisting
	// ---------------------------------------------------------------------
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForDocument, operation: ['sendExisting', 'get', 'download'] } },
	},

	// ---------------------------------------------------------------------
	// sendForSignature / sendExisting (shared)
	// ---------------------------------------------------------------------
	signersField,
	additionalSendFieldsField,

	// ---------------------------------------------------------------------
	// download
	// ---------------------------------------------------------------------
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the output item field that will contain the downloaded PDF',
		displayOptions: { show: { ...showOnlyForDocument, operation: ['download'] } },
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
		displayOptions: { show: { ...showOnlyForDocument, operation: ['list'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...showOnlyForDocument, operation: ['list'], returnAll: [false] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForDocument, operation: ['list'] } },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Cancelled', value: 'CANCELLED' },
					{ name: 'Generated', value: 'GENERATED' },
					{ name: 'Signed', value: 'SIGNED' },
					{ name: 'Signers Assigned', value: 'SIGNERS_ASSIGNED' },
					{ name: 'Signing in Progress', value: 'SIGNING_IN_PROGRESS' },
					{ name: 'Waiting for Signature', value: 'WAITING_FOR_SIGNATURE' },
				],
			},
			{
				displayName: 'Tag IDs',
				name: 'tagIds',
				type: 'string',
				default: '',
				description: 'Comma-separated tag IDs. A document must carry all of them to match.',
			},
		],
	},
];
