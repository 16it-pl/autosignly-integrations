import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_SEND_FOR_SIGNATURE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { sendForSignatureHandler } from 'src/logic-functions/handlers/send-for-signature-handler';
import { type SendForSignatureInput } from 'src/logic-functions/utils/signer-input.type';

export default defineLogicFunction({
  universalIdentifier: LF_SEND_FOR_SIGNATURE_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-send-for-signature',
  description:
    'Sends one attachment of a record to Autosignly for electronic signature.',
  timeoutSeconds: 60,
  handler: async (event: RoutePayload) =>
    sendForSignatureHandler((event.body ?? {}) as SendForSignatureInput),
  httpRouteTriggerSettings: {
    path: '/autosignly/send',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
