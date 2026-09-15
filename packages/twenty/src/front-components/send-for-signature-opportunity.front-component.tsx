import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_OPPORTUNITY_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SignerForm } from 'src/front-components/components/SignerForm';

// Thin shell: the execution context carries the record id but not its object
// type, and a command menu item cannot pass props, so the object is bound here.
const SendForSignatureOpportunity = () => <SignerForm objectType="opportunity" />;

export default defineFrontComponent({
  universalIdentifier: FC_OPPORTUNITY_UNIVERSAL_IDENTIFIER,
  name: 'send-for-signature-opportunity',
  description: 'Send an attachment of this record for signature.',
  component: SendForSignatureOpportunity,
});
