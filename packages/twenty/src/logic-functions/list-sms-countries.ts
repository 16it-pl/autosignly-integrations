import { defineLogicFunction } from 'twenty-sdk/define';

import { LF_LIST_SMS_COUNTRIES_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';

export type SmsCountriesResult = {
  success: boolean;
  countries?: { countryCode?: string; name?: string; dialingPrefix?: string }[];
  error?: string;
};

// A phone number outside this list is refused when the SMS code is requested,
// which happens after the document has already gone out. The form checks it
// up front so the failure never reaches the signer.
export const listSmsCountriesHandler = async (): Promise<SmsCountriesResult> => {
  try {
    const countries = await createAutosignlyClient().listSmsCountries();

    return { success: true, countries };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not read the SMS country list.',
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: LF_LIST_SMS_COUNTRIES_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-list-sms-countries',
  description: 'Countries an SMS verification code can be delivered to.',
  timeoutSeconds: 15,
  handler: listSmsCountriesHandler,
  httpRouteTriggerSettings: {
    path: '/autosignly/sms-countries',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
