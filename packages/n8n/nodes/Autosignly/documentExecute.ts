import type { AutosignlyClient, ListDocumentsOptions, Signer } from '@16it/autosignly';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { splitList } from './GenericFunctions';

interface SignerParameter {
	firstName: string;
	lastName: string;
	email: string;
	country: string;
	phoneNumber?: string;
	locale?: string;
	order?: number;
	signatureType?: string;
	signatureVerificationMethod?: string;
}

function toSigners(parameters: SignerParameter[]): Signer[] {
	return parameters.map((signer) => ({
		firstName: signer.firstName,
		lastName: signer.lastName,
		email: signer.email,
		country: signer.country,
		phoneNumber: signer.phoneNumber || undefined,
		locale: signer.locale || undefined,
		order: signer.order,
		signatureType: signer.signatureType || undefined,
		signatureVerificationMethod: signer.signatureVerificationMethod || undefined,
	}));
}

interface AdditionalSendFields {
	signatureType?: string;
	signatureMode?: string;
	verificationMethod?: string;
	initiatorEmail?: string;
	initiatorLocale?: string;
}

export async function executeDocumentOperation(
	this: IExecuteFunctions,
	client: AutosignlyClient,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'sendForSignature') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const documentName = this.getNodeParameter('documentName', itemIndex) as string;
		const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;
		const signerParameters = this.getNodeParameter(
			'signers.signer',
			itemIndex,
			[],
		) as SignerParameter[];
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as AdditionalSendFields;

		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const pdf = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

		const result = await client.uploadAndSign({
			pdf,
			documentName,
			fileName: fileName || binaryData.fileName,
			signers: toSigners(signerParameters),
			signatureType: additionalFields.signatureType || undefined,
			signatureMode: additionalFields.signatureMode || undefined,
			verificationMethod: additionalFields.verificationMethod || undefined,
			initiatorEmail: additionalFields.initiatorEmail || undefined,
			initiatorLocale: additionalFields.initiatorLocale || undefined,
		});

		return [{ json: result as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'upload') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const documentName = this.getNodeParameter('documentName', itemIndex) as string;
		const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;

		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const pdf = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

		const documentId = await client.uploadPdf({
			pdf,
			documentName,
			fileName: fileName || binaryData.fileName,
		});

		return [{ json: { documentId }, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'sendExisting') {
		const documentId = this.getNodeParameter('documentId', itemIndex) as string;
		const signerParameters = this.getNodeParameter(
			'signers.signer',
			itemIndex,
			[],
		) as SignerParameter[];
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as AdditionalSendFields;

		const result = await client.sendForSigning(documentId, {
			signers: toSigners(signerParameters),
			signatureType: additionalFields.signatureType || undefined,
			signatureMode: additionalFields.signatureMode || undefined,
			verificationMethod: additionalFields.verificationMethod || undefined,
			initiatorEmail: additionalFields.initiatorEmail || undefined,
			initiatorLocale: additionalFields.initiatorLocale || undefined,
		});

		return [{ json: result as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'get') {
		const documentId = this.getNodeParameter('documentId', itemIndex) as string;
		const document = await client.getDocument(documentId);
		return [{ json: document as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'download') {
		const documentId = this.getNodeParameter('documentId', itemIndex) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

		const content = await client.downloadDocument(documentId);
		const binaryData = await this.helpers.prepareBinaryData(
			Buffer.from(content),
			`${documentId}.pdf`,
			'application/pdf',
		);

		return [
			{
				json: { documentId },
				binary: { [binaryPropertyName]: binaryData },
				pairedItem: { item: itemIndex },
			},
		];
	}

	// list
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const filters = this.getNodeParameter('filters', itemIndex, {}) as {
		status?: string[];
		tagIds?: string;
	};

	const listOptions: Omit<ListDocumentsOptions, 'page'> = {
		status: filters.status?.length ? filters.status : undefined,
		tagId: filters.tagIds ? splitList(filters.tagIds) : undefined,
	};

	if (returnAll) {
		const documents: IDataObject[] = [];
		for await (const document of client.iterDocuments(listOptions)) {
			documents.push(document as unknown as IDataObject);
		}
		return documents.map((json) => ({ json, pairedItem: { item: itemIndex } }));
	}

	const documents: IDataObject[] = [];
	let page = 0;
	while (documents.length < limit) {
		const size = Math.min(50, limit - documents.length);
		const result = await client.listDocuments({ ...listOptions, page, size });
		documents.push(...(result.content as unknown as IDataObject[]));
		page += 1;
		if (page >= result.totalPages || result.content.length === 0) break;
	}

	return documents
		.slice(0, limit)
		.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
