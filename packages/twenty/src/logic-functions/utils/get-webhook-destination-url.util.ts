import {
  WEBHOOK_CLAIM_QUERY_PARAMETER,
} from 'src/logic-functions/utils/get-webhook-claim-key.util';
import { LF_WEBHOOK_RESOLVER_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const getWebhookDestinationUrl = ({
  apiUrl,
  claimToken,
}: {
  apiUrl: string;
  claimToken: string;
}): string => {
  const destinationUrl = new URL(apiUrl);
  const apiBasePath = destinationUrl.pathname.replace(/\/+$/, '');

  destinationUrl.pathname = `${apiBasePath}/webhooks/server/${LF_WEBHOOK_RESOLVER_UNIVERSAL_IDENTIFIER}`;
  destinationUrl.searchParams.set(WEBHOOK_CLAIM_QUERY_PARAMETER, claimToken);

  return destinationUrl.toString();
};
