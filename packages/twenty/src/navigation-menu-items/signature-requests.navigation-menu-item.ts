import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  SIGNATURE_REQUESTS_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SIGNATURE_REQUESTS_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Signature requests',
  icon: 'IconSignature',
  color: 'green',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: SIGNATURE_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
});
