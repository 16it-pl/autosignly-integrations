import type { AutosignlyClient } from '@16it/autosignly';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { splitList } from './GenericFunctions';

export async function executeTagOperation(
	this: IExecuteFunctions,
	client: AutosignlyClient,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'setOnDocument') {
		const documentId = this.getNodeParameter('documentId', itemIndex) as string;
		const tagIds = this.getNodeParameter('tagIds', itemIndex, '') as string;
		const names = this.getNodeParameter('names', itemIndex, '') as string;

		const tags = await client.setDocumentTags(documentId, {
			tagIds: tagIds ? splitList(tagIds) : undefined,
			names: names ? splitList(names) : undefined,
		});

		return tags.map((tag) => ({
			json: tag as unknown as IDataObject,
			pairedItem: { item: itemIndex },
		}));
	}

	if (operation === 'create') {
		const name = this.getNodeParameter('name', itemIndex) as string;
		const tag = await client.createTag(name);
		return [{ json: tag as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'delete') {
		const tagId = this.getNodeParameter('tagId', itemIndex) as string;
		await client.deleteTag(tagId);
		return [{ json: { tagId, deleted: true }, pairedItem: { item: itemIndex } }];
	}

	// list
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const filters = this.getNodeParameter('filters', itemIndex, {}) as { name?: string };

	const tags: IDataObject[] = [];
	let page = 0;
	for (;;) {
		const size = returnAll ? 50 : Math.min(50, limit - tags.length);
		const result = await client.listTags({ name: filters.name || undefined, page, size });
		tags.push(...(result.content as unknown as IDataObject[]));
		page += 1;
		if (page >= result.totalPages || result.content.length === 0) break;
		if (!returnAll && tags.length >= limit) break;
	}

	return tags.slice(0, returnAll ? undefined : limit).map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
