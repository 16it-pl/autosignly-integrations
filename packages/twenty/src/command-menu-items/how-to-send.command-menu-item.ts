import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  CMD_HOW_TO_SEND_UNIVERSAL_IDENTIFIER,
  FC_HOW_TO_SEND_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: CMD_HOW_TO_SEND_UNIVERSAL_IDENTIFIER,
  label: 'How to send a document',
  shortLabel: 'How to send',
  isPinned: true,
  // Takes the place the "New Signature request" button used to hold: the object
  // is not creatable by hand, so someone arriving at this list needs to be told
  // where requests actually come from.
  conditionalPinnedExpression: 'pageType == "INDEX_PAGE"',
  availabilityType: 'GLOBAL_OBJECT_CONTEXT',
  availabilityObjectUniversalIdentifier:
    SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: FC_HOW_TO_SEND_UNIVERSAL_IDENTIFIER,
});
