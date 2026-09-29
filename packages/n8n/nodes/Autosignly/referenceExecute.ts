import type { AutosignlyClient } from '@16it/autosignly';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export async function executeReferenceOperation(
	this: IExecuteFunctions,
	client: AutosignlyClient,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'getSignaturePolicy') {
		const country = this.getNodeParameter('country', itemIndex) as string;
		const policy = await client.getSignaturePolicy(country);
		return [{ json: policy as unknown as IDataObject, pairedItem: { item: itemIndex } }];
	}

	// listSmsCountries
	const countries = await client.listSmsCountries();
	return countries.map((country) => ({
		json: country as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}
