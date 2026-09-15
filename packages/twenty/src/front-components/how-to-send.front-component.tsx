import { defineFrontComponent } from 'twenty-sdk/define';

import { FC_HOW_TO_SEND_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { HowToSend } from 'src/front-components/components/HowToSend';

export default defineFrontComponent({
  universalIdentifier: FC_HOW_TO_SEND_UNIVERSAL_IDENTIFIER,
  name: 'how-to-send',
  description: 'Explains where signature requests come from and how to make one.',
  component: HowToSend,
});
