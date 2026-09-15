import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  SG_SIGNATURE_REQUEST_FIELD_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  SR_SIGNERS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// The "many" side: every signer belongs to one signature request.
export default defineField({
  universalIdentifier: SG_SIGNATURE_REQUEST_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'signatureRequest',
  label: 'Signature request',
  description: 'The request this signer belongs to.',
  icon: 'IconSignature',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SR_SIGNERS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'signatureRequestId',
  },
});
