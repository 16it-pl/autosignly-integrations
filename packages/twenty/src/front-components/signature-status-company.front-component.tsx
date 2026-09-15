import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_STATUS_COMPANY_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordSignatures } from 'src/front-components/components/RecordSignatures';

const SignatureStatusCompany = () => <RecordSignatures objectType="company" />;

export default defineFrontComponent({
  universalIdentifier: FC_STATUS_COMPANY_UNIVERSAL_IDENTIFIER,
  name: 'signature-status-company',
  description: 'Signature requests made from this record, with signer progress.',
  component: SignatureStatusCompany,
});
