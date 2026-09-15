import { defineViewField } from 'twenty-sdk/define';

import {
  recordPageViewFieldUniversalIdentifier,
  SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/record-page-view.constant';
import { SR_SIGNING_URL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Autosignly returns a link only in a sandbox, so on the record page this is a
// permanently empty row in production and a stray sandbox link everywhere else.
// The app already offers the link where it is actually useful: right after
// sending, and in Signature status on the source record.
export default defineViewField({
  universalIdentifier: recordPageViewFieldUniversalIdentifier(
    SR_SIGNING_URL_FIELD_UNIVERSAL_IDENTIFIER,
  ),
  viewUniversalIdentifier:
    SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER,
  fieldMetadataUniversalIdentifier: SR_SIGNING_URL_FIELD_UNIVERSAL_IDENTIFIER,
  position: 5,
  isVisible: false,
  // The width Twenty gave it, kept so re-enabling the row does not hand back a
  // zero-width one.
  size: 180,
});
