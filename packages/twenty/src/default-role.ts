import { defineApplicationRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: `${APP_DISPLAY_NAME} default function role`,
  description:
    'Reads the attachments and people on a record to build a signature request, and writes the request, its signers and the signed PDF back.',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
  // Without this the settings panel cannot read its own application variables:
  // the metadata API answers "Entity performing the request does not have
  // permission" and the panel renders an error instead of the credentials form.
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.APPLICATIONS],
});
