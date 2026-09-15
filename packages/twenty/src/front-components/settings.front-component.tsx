import { defineSettingsFrontComponent } from 'twenty-sdk/define';

import { SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AutosignlySettings } from 'src/front-components/components/AutosignlySettings';

export default defineSettingsFrontComponent({
  universalIdentifier: SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'autosignly-settings',
  description:
    'Autosignly credentials and the webhook URL to register in Autosignly.',
  component: AutosignlySettings,
});
