import {
  getSystemViewFieldUniversalIdentifier,
  getSystemViewUniversalIdentifier,
  SYSTEM_VIEW_KEYS,
} from 'twenty-sdk/define';

import {
  APPLICATION_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Twenty generates the record page's Fields widget itself, one view per object,
// under an identifier derived from the object. Deriving the same identifier
// edits that view in place, which is what keeps the Home, Timeline, Tasks and
// Notes tabs: declaring a page layout of our own would mean rebuilding all of
// them to hide two fields.
export const SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER =
  getSystemViewUniversalIdentifier({
    objectMetadataApplicationUniversalIdentifier:
      APPLICATION_UNIVERSAL_IDENTIFIER,
    objectUniversalIdentifier: SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
    viewKey: SYSTEM_VIEW_KEYS.FIELDS_WIDGET,
  });

export const recordPageViewFieldUniversalIdentifier = (
  fieldMetadataUniversalIdentifier: string,
): string =>
  getSystemViewFieldUniversalIdentifier({
    fieldMetadataApplicationUniversalIdentifier:
      APPLICATION_UNIVERSAL_IDENTIFIER,
    viewUniversalIdentifier:
      SIGNATURE_REQUEST_RECORD_PAGE_VIEW_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier,
  });
