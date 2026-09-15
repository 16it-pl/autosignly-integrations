import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_PERSON_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SignerForm } from 'src/front-components/components/SignerForm';

// Thin shell: the execution context carries the record id but not its object
// type, and a command menu item cannot pass props, so the object is bound here.
const SendForSignaturePerson = () => <SignerForm objectType="person" />;

export default defineFrontComponent({
  universalIdentifier: FC_PERSON_UNIVERSAL_IDENTIFIER,
  name: 'send-for-signature-person',
  description: 'Send an attachment of this record for signature.',
  component: SendForSignaturePerson,
});
