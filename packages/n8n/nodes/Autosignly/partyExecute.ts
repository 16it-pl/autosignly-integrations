import type { AutosignlyClient, Party } from '@16it/autosignly';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

interface PartyAdditionalFields {
	firstname?: string;
	taxId?: string;
	email?: string;
	phone?: string;
	street?: string;
	number?: string;
	postalCode?: string;
	city?: string;
	countryCode?: string;
}

function buildParty(type: string, name: string, additionalFields: PartyAdditionalFields): Party {
	const hasAddress = [
		additionalFields.street,
		additionalFields.number,
		additionalFields.postalCode,
		additionalFields.city,
		additionalFields.countryCode,
	].some(Boolean);

	return {
		type,
		name,
		firstname: additionalFields.firstname || undefined,
		taxId: additionalFields.taxId || undefined,
		email: additionalFields.email || undefined,
		phone: additionalFields.phone || undefined,
		address: hasAddress
			? {
					street: additionalFields.street || undefined,
					number: additionalFields.number || undefined,
					postalCode: additionalFields.postalCode || undefined,
					city: additionalFields.city || undefined,
					countryCode: additionalFields.countryCode || undefined,
				}
			: undefined,
	};
}

export async function executePartyOperation(
	this: IExecuteFunctions,
	client: AutosignlyClient,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'create' || operation === 'update') {
		const type = this.getNodeParameter('type', itemIndex) as string;
		const name = this.getNodeParameter('name', itemIndex) as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as PartyAdditionalFields;
		const party = buildParty(type, name, additionalFields);

		const result =
			operation === 'create'
				? await client.createParty(party)
				: await client.updateParty(this.getNodeParameter('partyId', itemIndex) as string, party);

		return [{ json: result as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'get') {
		const partyId = this.getNodeParameter('partyId', itemIndex) as string;
		const party = await client.getParty(partyId);
		return [{ json: party as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	if (operation === 'delete') {
		const partyId = this.getNodeParameter('partyId', itemIndex) as string;
		await client.deleteParty(partyId);
		return [{ json: { partyId, deleted: true }, pairedItem: { item: itemIndex } }];
	}

	// list
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const filters = this.getNodeParameter('filters', itemIndex, {}) as {
		name?: string;
		type?: string;
	};

	const parties: IDataObject[] = [];
	let page = 0;
	for (;;) {
		const size = returnAll ? 50 : Math.min(50, limit - parties.length);
		const result = await client.listParties({
			name: filters.name || undefined,
			type: filters.type || undefined,
			page,
			size,
		});
		parties.push(...(result.content as unknown as IDataObject[]));
		page += 1;
		if (page >= result.totalPages || result.content.length === 0) break;
		if (!returnAll && parties.length >= limit) break;
	}

	return parties
		.slice(0, returnAll ? undefined : limit)
		.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
