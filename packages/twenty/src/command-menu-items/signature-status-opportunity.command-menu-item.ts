import {
  defineCommandMenuItem,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CMD_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  FC_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: CMD_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  label: 'Signature status',
  shortLabel: 'Signatures',
  isPinned: false,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  frontComponentUniversalIdentifier: FC_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
});
