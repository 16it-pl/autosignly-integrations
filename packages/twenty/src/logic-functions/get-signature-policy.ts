import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_GET_SIGNATURE_POLICY_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';

export type SignaturePolicyResult = {
  success: boolean;
  country?: string;
  defaultPolicy?: boolean;
  signatureTypes?: { type?: string; verificationMethods: string[] }[];
  error?: string;
};

// Proxied because the API secret is injected into logic functions only. The
// form needs the policy live: a signer whose combination the policy does not
// list is rejected when the document goes out.
export const getSignaturePolicyHandler = async (
  event: RoutePayload,
): Promise<SignaturePolicyResult> => {
  const body = event.body as { country?: string } | null;
  const country = body?.country?.trim().toUpperCase();

  if (!country || country.length !== 2) {
    return { success: false, error: 'A two-letter country code is required.' };
  }

  try {
    const policy = await createAutosignlyClient().getSignaturePolicy(country);

    return {
      success: true,
      country: policy.country ?? country,
      defaultPolicy: policy.defaultPolicy,
      signatureTypes: policy.signatureTypes,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not read the signature policy.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_GET_SIGNATURE_POLICY_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-get-signature-policy',
  description: 'Signature types and verification methods allowed for a country.',
  timeoutSeconds: 15,
  handler: getSignaturePolicyHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/signature-policy',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
