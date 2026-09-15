import { defineView } from 'twenty-sdk/define';

import {
  SG_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
  SG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SG_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SGV_EMAIL_UNIVERSAL_IDENTIFIER,
  SGV_NAME_UNIVERSAL_IDENTIFIER,
  SGV_STATUS_UNIVERSAL_IDENTIFIER,
  SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  SIGNERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: SIGNERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All signers',
  objectUniversalIdentifier: SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconUserCheck',
  position: 0,
  fields: [
    {
      universalIdentifier: SGV_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: SGV_EMAIL_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SG_EMAIL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: SGV_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: SG_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 120,
    },
  ],
});
