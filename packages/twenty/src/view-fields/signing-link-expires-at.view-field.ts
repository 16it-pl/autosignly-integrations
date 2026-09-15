import { defineViewField } from 'twenty-sdk/define';

import {
  recordPageViewFieldUniversalIdentifier,
  SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/record-page-view.constant';
import { SR_SIGNING_URL_EXPIRES_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Follows the link it belongs to: an expiry date on its own says nothing.
export default defineViewField({
  universalIdentifier: recordPageViewFieldUniversalIdentifier(
    SR_SIGNING_URL_EXPIRES_FIELD_UNIVERSAL_IDENTIFIER,
  ),
  viewUniversalIdentifier:
    SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER,
  fieldMetadataUniversalIdentifier:
    SR_SIGNING_URL_EXPIRES_FIELD_UNIVERSAL_IDENTIFIER,
  position: 6,
  isVisible: false,
  // The width Twenty gave it, kept so re-enabling the row does not hand back a
  // zero-width one.
  size: 180,
});
