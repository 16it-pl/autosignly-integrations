import type { INodeProperties } from 'n8n-workflow';

const showOnlyForTag = {
	resource: ['tag'],
};

export const tagOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: showOnlyForTag },
	default: 'setOnDocument',
	options: [
		{
			name: 'Set on Document',
			value: 'setOnDocument',
			description: "Replace a document's whole tag set",
			action: 'Set tags on a document',
		},
		{
			name: 'List',
			value: 'list',
			description: 'List the company tag pool for this environment',
			action: 'List tags',
		},
		{
			name: 'Create',
			value: 'create',
			description: 'Add a tag to the company pool, or return the existing one with that name',
			action: 'Create a tag',
		},
		{
			name: 'Delete',
			value: 'delete',
			description: 'Remove a tag from the pool and from every document carrying it',
			action: 'Delete a tag',
		},
	],
};

export const tagFields: INodeProperties[] = [
	// ---------------------------------------------------------------------
	// setOnDocument
	// ---------------------------------------------------------------------
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForTag, operation: ['setOnDocument'] } },
	},
	{
		displayName: 'Tag IDs',
		name: 'tagIds',
		type: 'string',
		default: '',
		description: 'Comma-separated IDs of existing tags',
		displayOptions: { show: { ...showOnlyForTag, operation: ['setOnDocument'] } },
	},
	{
		displayName: 'Tag Names',
		name: 'names',
		type: 'string',
		default: '',
		description: 'Comma-separated tag names, each up to 15 characters. A name not in the pool yet is created.',
		displayOptions: { show: { ...showOnlyForTag, operation: ['setOnDocument'] } },
	},
	{
		displayName: 'Leaving both Tag IDs and Tag Names empty clears every tag on the document.',
		name: 'setOnDocumentNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { ...showOnlyForTag, operation: ['setOnDocument'] } },
	},

	// ---------------------------------------------------------------------
	// create / delete
	// ---------------------------------------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'Up to 15 characters',
		displayOptions: { show: { ...showOnlyForTag, operation: ['create'] } },
	},
	{
		displayName: 'Tag ID',
		name: 'tagId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForTag, operation: ['delete'] } },
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
		displayOptions: { show: { ...showOnlyForTag, operation: ['list'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...showOnlyForTag, operation: ['list'], returnAll: [false] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...showOnlyForTag, operation: ['list'] } },
		options: [
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
		],
	},
];
