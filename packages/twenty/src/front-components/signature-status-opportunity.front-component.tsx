import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordSignatures } from 'src/front-components/components/RecordSignatures';

const SignatureStatusOpportunity = () => <RecordSignatures objectType="opportunity" />;

export default defineFrontComponent({
  universalIdentifier: FC_STATUS_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  name: 'signature-status-opportunity',
  description: 'Signature requests made from this record, with signer progress.',
  component: SignatureStatusOpportunity,
});
