import { AutosignlyClient, PRODUCTION_BASE_URL } from '@16it/autosignly';
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

const SIGNATURE_TYPE_LABELS: Record<string, string> = {
	SES: 'Simple (SES)',
	AES: 'Advanced (AES)',
	QES: 'Qualified (QES)',
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
	SMS: 'SMS',
	WK: 'Bank / National ID (WK)',
};

/**
 * The empty-value entry every list starts with: leaving it selected means
 * "send nothing for this signer" so the document-level Additional Fields
 * value (or Autosignly's own SES default) applies instead. Sending a
 * concrete value unconditionally — even the same one Additional Fields
 * already sets — makes the API prefer the per-signer field and silently
 * ignore Additional Fields, which is not what a default is for.
 */
const UNSET_OPTION: INodePropertyOptions = { name: 'Default (From Additional Fields)', value: '' };

const DEFAULT_SIGNATURE_TYPES: INodePropertyOptions[] = [
	UNSET_OPTION,
	{ name: 'Simple (SES)', value: 'SES' },
	{ name: 'Advanced (AES)', value: 'AES' },
	{ name: 'Qualified (QES)', value: 'QES' },
];

const DEFAULT_VERIFICATION_METHODS: INodePropertyOptions[] = [
	UNSET_OPTION,
	{ name: 'SMS', value: 'SMS' },
	{ name: 'Bank / National ID (WK)', value: 'WK' },
];

async function getClient(context: ILoadOptionsFunctions): Promise<AutosignlyClient> {
	const credentials = await context.getCredentials('autosignlyApi');
	return new AutosignlyClient(String(credentials.apiKey), String(credentials.apiSecret), {
		baseUrl: String(credentials.baseUrl || PRODUCTION_BASE_URL),
	});
}

/**
 * What Autosignly's signature policy for the signer's country actually allows —
 * loaded live rather than offered as a fixed list, so a signer from a country
 * that does not support e.g. QES simply never sees it as an option.
 *
 * The leading `&` on `getCurrentNodeParameter('&country')` is required, not
 * decorative: this field lives inside a repeatable fixedCollection item
 * (Signers), and the plain sibling name `'country'` resolves to `undefined`
 * there — confirmed by testing directly against a running n8n instance. `&`
 * scopes the lookup to the same collection entry being edited.
 *
 * Falls back to the full generic list before a country is typed, or if the
 * policy lookup itself fails — a dropdown that goes empty on a typo is worse
 * than one that is briefly too permissive.
 */
export async function getSignatureTypesForSigner(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const country = (this.getCurrentNodeParameter('&country') as string) || '';
	if (!country) return DEFAULT_SIGNATURE_TYPES;

	try {
		const policy = await getClient(this).then((client) => client.getSignaturePolicy(country));
		if (policy.signatureTypes.length === 0) return DEFAULT_SIGNATURE_TYPES;
		return [
			UNSET_OPTION,
			...policy.signatureTypes.map((allowed) => ({
				name: SIGNATURE_TYPE_LABELS[allowed.type ?? ''] ?? allowed.type ?? '',
				value: allowed.type ?? '',
			})),
		];
	} catch {
		return DEFAULT_SIGNATURE_TYPES;
	}
}

/** Same policy lookup as {@link getSignatureTypesForSigner}, narrowed to the chosen Signature Type. */
export async function getVerificationMethodsForSigner(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const country = (this.getCurrentNodeParameter('&country') as string) || '';
	const signatureType = (this.getCurrentNodeParameter('&signatureType') as string) || 'AES';
	if (!country) return DEFAULT_VERIFICATION_METHODS;

	try {
		const policy = await getClient(this).then((client) => client.getSignaturePolicy(country));
		const allowed = policy.signatureTypes.find((type) => type.type === signatureType);
		const methods = allowed?.verificationMethods ?? [];
		if (methods.length === 0) return DEFAULT_VERIFICATION_METHODS;
		return [
			UNSET_OPTION,
			...methods.map((method) => ({
				name: VERIFICATION_METHOD_LABELS[method] ?? method,
				value: method,
			})),
		];
	} catch {
		return DEFAULT_VERIFICATION_METHODS;
	}
}
