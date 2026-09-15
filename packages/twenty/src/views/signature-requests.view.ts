import { defineView } from 'twenty-sdk/define';

import {
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
  SR_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SR_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SR_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SR_SIGNING_URL_FIELD_UNIVERSAL_IDENTIFIER,
  SR_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SRV_COMPLETED_AT_UNIVERSAL_IDENTIFIER,
  SRV_NAME_UNIVERSAL_IDENTIFIER,
  SRV_SENT_AT_UNIVERSAL_IDENTIFIER,
  SRV_SIGNING_URL_UNIVERSAL_IDENTIFIER,
  SRV_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: SIGNATURE_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All signature requests',
  objectUniversalIdentifier: SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconSignature',
  position: 0,
  fields: [
    {
      universalIdentifier: SRV_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SR_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: SRV_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SR_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: SRV_SIGNING_URL_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SR_SIGNING_URL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      // Autosignly returns a link only in a sandbox, so in production this
      // column is an empty stripe down the whole list. Kept in the view rather
      // than dropped, so anyone testing can switch it back on under Options.
      isVisible: false,
      size: 220,
    },
    {
      universalIdentifier: SRV_SENT_AT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SR_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: SRV_COMPLETED_AT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        SR_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
