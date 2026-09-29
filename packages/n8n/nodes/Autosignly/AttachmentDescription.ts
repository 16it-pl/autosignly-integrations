import type { INodeProperties } from 'n8n-workflow';

const showOnlyForAttachment = {
	resource: ['attachment'],
};

export const attachmentOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: showOnlyForAttachment },
	default: 'add',
	options: [
		{
			name: 'Add',
			value: 'add',
			description: 'Attach a file to a document not yet sent for signing',
			action: 'Add an attachment',
		},
		{
			name: 'List',
			value: 'list',
			description: "List a document's attachments, in the order they will merge",
			action: 'List attachments',
		},
		{
			name: 'Download',
			value: 'download',
			description: 'Download one attachment as converted to PDF — the rendition that gets merged',
			action: 'Download an attachment',
		},
		{
			name: 'Delete',
			value: 'delete',
			description: 'Remove an attachment from a document not yet sent for signing',
			action: 'Delete an attachment',
		},
	],
};

export const attachmentFields: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showOnlyForAttachment },
	},

	// ---------------------------------------------------------------------
	// add
	// ---------------------------------------------------------------------
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the input item field that contains the file (PDF, JPEG or PNG) to attach',
		displayOptions: { show: { ...showOnlyForAttachment, operation: ['add'] } },
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'attachment.pdf',
		description: "Defaults to the binary field's own file name",
		displayOptions: { show: { ...showOnlyForAttachment, operation: ['add'] } },
	},

	// ---------------------------------------------------------------------
	// download / delete
	// ---------------------------------------------------------------------
	{
		displayName: 'Attachment ID',
		name: 'attachmentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showOnlyForAttachment, operation: ['download', 'delete'] } },
	},
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the output item field that will contain the downloaded file',
		displayOptions: { show: { ...showOnlyForAttachment, operation: ['download'] } },
	},
];
