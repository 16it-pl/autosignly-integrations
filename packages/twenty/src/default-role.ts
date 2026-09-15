import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
  SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: '67f4ce0c-b0ab-4858-b06a-a04c41a2aabe',
  label: `${APP_DISPLAY_NAME} default role`,
  description:
    'Reads the attachment sent for signature, tracks the request and its signers, and writes the signed PDF back over the attachment it came from.',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...[
      SIGNATURE_REQUEST_OBJECT_UNIVERSAL_IDENTIFIER,
      SIGNER_OBJECT_UNIVERSAL_IDENTIFIER,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment.universalIdentifier,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    })),
    ...[
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    })),
  ],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [
    SystemPermissionFlag.APPLICATIONS,
    SystemPermissionFlag.UPLOAD_FILE,
    SystemPermissionFlag.DOWNLOAD_FILE,
  ],
});
