import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  SG_SIGNATURE_REQUEST_FIELD_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  SR_SIGNERS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// The "one" side: a request lists everyone asked to sign it.
export default defineField({
  universalIdentifier: SR_SIGNERS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'signers',
  label: 'Signers',
  description: 'Everyone asked to sign this document.',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SG_SIGNATURE_REQUEST_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
