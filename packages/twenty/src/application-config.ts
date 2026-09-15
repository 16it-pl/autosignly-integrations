import { defineApplication } from 'twenty-sdk/define';

import {
  API_KEY_VARIABLE_UNIVERSAL_IDENTIFIER,
  API_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
  API_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  WEBHOOK_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  logo: 'public/autosignly.png',
  galleryImages: [
    'public/gallery/01-send-for-signature.png',
    'public/gallery/02-multiple-signers.png',
    'public/gallery/03-signature-status.png',
    'public/gallery/04-settings.png',
  ],
  author: 'Autosignly',
  category: 'Productivity',
  websiteUrl: 'https://autosignly.eu',
  termsUrl: 'https://autosignly.eu/terms',
  emailSupport: 'support@autosignly.eu',
  issueReportUrl: 'https://github.com/16it-pl/autosignly-integrations/issues',
  applicationVariables: {
    AUTOSIGNLY_API_KEY: {
      universalIdentifier: API_KEY_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'API key',
      description:
        'API key created in Autosignly (Settings, API keys). Sandbox keys work here too.',
      isSecret: true,
    },
    AUTOSIGNLY_API_SECRET: {
      universalIdentifier: API_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'API secret',
      description: 'The secret shown once when the API key was created.',
      isSecret: true,
    },
    AUTOSIGNLY_WEBHOOK_SECRET: {
      universalIdentifier: WEBHOOK_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Webhook signing key',
      description:
        'Paste this after registering the webhook URL shown below in Autosignly. Without it, signed documents never come back.',
      isSecret: true,
    },
    AUTOSIGNLY_API_URL: {
      universalIdentifier: API_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'API base URL',
      description:
        'Leave empty unless you were given a different endpoint. Origin plus /api, for example https://app.autosignly.eu/api. The version prefix is added automatically.',
      isSecret: false,
    },
  },
});
