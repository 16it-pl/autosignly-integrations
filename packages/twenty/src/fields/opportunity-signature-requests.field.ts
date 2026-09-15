import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OPPORTUNITY_SR_FIELD_UNIVERSAL_IDENTIFIER,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  SR_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// The "one" side, hosted on the standard Opportunity object.
export default defineField({
  universalIdentifier: OPPORTUNITY_SR_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'signatureRequests',
  label: 'Signature requests',
  description: 'Documents sent for signature from this opportunity.',
  icon: 'IconSignature',
  isNullable: true,
  // Filled in by the app when a document goes out, never by hand: the picker
  // this would otherwise open lists every request in the workspace, which
  // invites linking somebody else's document to this record.
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SR_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
