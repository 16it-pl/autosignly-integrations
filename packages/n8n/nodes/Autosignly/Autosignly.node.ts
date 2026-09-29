import { AutosignlyClient, PRODUCTION_BASE_URL } from '@16it/autosignly';
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { attachmentFields, attachmentOperations } from './AttachmentDescription';
import { executeAttachmentOperation } from './attachmentExecute';
import { documentFields, documentOperations } from './DocumentDescription';
import { executeDocumentOperation } from './documentExecute';
import { toNodeError } from './GenericFunctions';
import { getSignatureTypesForSigner, getVerificationMethodsForSigner } from './loadOptions';
import { partyFields, partyOperations } from './PartyDescription';
import { executePartyOperation } from './partyExecute';
import { referenceFields, referenceOperations } from './ReferenceDescription';
import { executeReferenceOperation } from './referenceExecute';
import { tagFields, tagOperations } from './TagDescription';
import { executeTagOperation } from './tagExecute';

export class Autosignly implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Autosignly',
		name: 'autosignly',
		icon: { light: 'file:../../icons/autosignly.svg', dark: 'file:../../icons/autosignly.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Send documents for electronic signature with Autosignly',
		defaults: { name: 'Autosignly' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'autosignlyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'document',
				options: [
					{ name: 'Attachment', value: 'attachment' },
					{ name: 'Document', value: 'document' },
					{ name: 'Party', value: 'party' },
					{ name: 'Reference', value: 'reference' },
					{ name: 'Tag', value: 'tag' },
				],
			},
			documentOperations,
			attachmentOperations,
			partyOperations,
			tagOperations,
			referenceOperations,
			...documentFields,
			...attachmentFields,
			...partyFields,
			...tagFields,
			...referenceFields,
		],
	};

	methods = {
		loadOptions: {
			getSignatureTypesForSigner,
			getVerificationMethodsForSigner,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('autosignlyApi');
		const client = new AutosignlyClient(String(credentials.apiKey), String(credentials.apiSecret), {
			baseUrl: String(credentials.baseUrl || PRODUCTION_BASE_URL),
		});

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				let results: INodeExecutionData[];

				if (resource === 'document') {
					results = await executeDocumentOperation.call(this, client, operation, itemIndex);
				} else if (resource === 'attachment') {
					results = await executeAttachmentOperation.call(this, client, operation, itemIndex);
				} else if (resource === 'party') {
					results = await executePartyOperation.call(this, client, operation, itemIndex);
				} else if (resource === 'tag') {
					results = await executeTagOperation.call(this, client, operation, itemIndex);
				} else {
					results = await executeReferenceOperation.call(this, client, operation, itemIndex);
				}

				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw toNodeError(this.getNode(), error, itemIndex);
			}
		}

		return [returnData];
	}
}
