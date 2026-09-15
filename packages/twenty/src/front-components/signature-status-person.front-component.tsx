import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_STATUS_PERSON_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordSignatures } from 'src/front-components/components/RecordSignatures';

const SignatureStatusPerson = () => <RecordSignatures objectType="person" />;

export default defineFrontComponent({
  universalIdentifier: FC_STATUS_PERSON_UNIVERSAL_IDENTIFIER,
  name: 'signature-status-person',
  description: 'Signature requests made from this record, with signer progress.',
  component: SignatureStatusPerson,
});
