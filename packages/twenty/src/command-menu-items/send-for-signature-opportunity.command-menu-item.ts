import {
  defineCommandMenuItem,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CMD_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  FC_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: CMD_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  label: 'Send for signature',
  shortLabel: 'Sign',
  isPinned: false,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  frontComponentUniversalIdentifier: FC_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
});
