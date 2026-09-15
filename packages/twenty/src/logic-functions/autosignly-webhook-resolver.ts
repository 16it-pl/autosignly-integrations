import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import {
  kv,
  Response,
  type ServerRouteResolverResult,
} from 'twenty-sdk/logic-function';

import {
  LF_WEBHOOK_RESOLVER_UNIVERSAL_IDENTIFIER,
  LF_WEBHOOK_TARGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  getWebhookClaimKey,
  WEBHOOK_CLAIM_QUERY_PARAMETER,
} from 'src/logic-functions/utils/get-webhook-claim-key.util';

export const autosignlyWebhookResolverHandler = async (
  routePayload: RoutePayload<unknown>,
): Promise<ServerRouteResolverResult> => {
  const claimToken =
    routePayload.queryStringParameters?.[WEBHOOK_CLAIM_QUERY_PARAMETER];

  if (!claimToken) {
    return new Response(
      { error: 'Missing Autosignly connection token' },
      { status: 400 },
    );
  }

  const workspaceId = await kv.get<string>(getWebhookClaimKey(claimToken), {
    scope: 'SERVER',
  });

  if (!workspaceId) {
    return new Response(
      { error: 'Unknown Autosignly connection' },
      { status: 404 },
    );
  }

  // This resolver runs in the owner workspace and has no access to another
  // install's signing key, so it cannot verify the signature. The whole
  // RoutePayload is forwarded, rawBody and headers included, and the target
  // verifies with its own secret before doing anything.
  return {
    workspaceId,
    targetLogicFunctionUniversalIdentifier:
      LF_WEBHOOK_TARGET_UNIVERSAL_IDENTIFIER,
    payload: routePayload,
  };
};

export default defineLogicFunction({
  universalIdentifier: LF_WEBHOOK_RESOLVER_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-webhook-resolver',
  description:
    'Routes an Autosignly delivery to the workspace that claimed the token in its URL.',
  timeoutSeconds: 15,
  handler: autosignlyWebhookResolverHandler,
  serverRouteTriggerSettings: {
    httpMethods: ['POST'],
    forwardedRequestHeaders: [
      'x-webhook-signature',
      'x-webhook-timestamp',
      'content-type',
    ],
  },
});
