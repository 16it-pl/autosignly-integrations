import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LF_WEBHOOK_TARGET_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { autosignlyWebhookHandler } from 'src/logic-functions/handlers/autosignly-webhook-handler';

export default defineLogicFunction({
  universalIdentifier: LF_WEBHOOK_TARGET_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-webhook',
  description:
    'Verifies an Autosignly delivery and writes the result onto the signature request.',
  // Room for the closing-seal wait on the last signature: the resolver has
  // already answered the sender, so nothing is held up by a slow run here.
  timeoutSeconds: 120,
  handler: (routePayload: RoutePayload<unknown>) =>
    autosignlyWebhookHandler(routePayload),
});
