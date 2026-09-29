import type { AutosignlyClient } from '@16it/autosignly';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export async function executeAttachmentOperation(
	this: IExecuteFunctions,
	client: AutosignlyClient,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;

	if (operation === 'add') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;

		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const content = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

		const attachment = await client.addAttachment(documentId, {
			content,
			fileName: fileName || binaryData.fileName || 'attachment',
		});

		return [{ json: attachment as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'delete') {
		const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
		await client.deleteAttachment(documentId, attachmentId);
		return [{ json: { documentId, attachmentId, deleted: true }, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'download') {
		const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

		const content = await client.downloadAttachment(documentId, attachmentId);
		const binaryData = await this.helpers.prepareBinaryData(
			Buffer.from(content),
			`${attachmentId}.pdf`,
			'application/pdf',
		);

		return [
			{
				json: { documentId, attachmentId },
				binary: { [binaryPropertyName]: binaryData },
				pairedItem: { item: itemIndex },
			},
		];
	}

	// list
	const attachments = await client.listAttachments(documentId);
	return attachments.map((attachment) => ({
		json: attachment as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}
