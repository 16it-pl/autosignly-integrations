import 'twenty-ui/style.css';

import styled from '@emotion/styled';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[4]};
  padding: ${() => themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledLead = styled.div`
  color: ${() => themeCssVariables.font.color.secondary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledStep = styled.div`
  display: flex;
  gap: ${() => themeCssVariables.spacing[3]};
`;

const StyledNumber = styled.div`
  align-items: center;
  background: ${() => themeCssVariables.background.tertiary};
  border-radius: 50%;
  color: ${() => themeCssVariables.font.color.secondary};
  display: flex;
  flex: 0 0 auto;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  height: 20px;
  justify-content: center;
  width: 20px;
`;

const StyledStepText = styled.div`
  color: ${() => themeCssVariables.font.color.primary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledNote = styled.div`
  border-top: 1px solid ${() => themeCssVariables.border.color.light};
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  line-height: 1.5;
  padding-top: ${() => themeCssVariables.spacing[3]};
`;

const STEPS = [
  'Open the Person, Company or Opportunity the document belongs to.',
  'Attach the PDF to that record, if it is not there already.',
  'Open the command menu and choose Send for signature.',
  'Pick the file, add the signers, send.',
];

export const HowToSend = () => (
  <StyledContainer>
    <StyledLead>
      Signature requests are written by Autosignly as documents go out and as
      signatures come in. They are not created here.
    </StyledLead>
    {STEPS.map((step, index) => (
      <StyledStep key={step}>
        <StyledNumber>{index + 1}</StyledNumber>
        <StyledStepText>{step}</StyledStepText>
      </StyledStep>
    ))}
    <StyledNote>
      The request appears in this list straight away and updates itself as each
      person signs. Signature status on the same record shows the same documents
      with their progress, and the signed file replaces the attachment it was
      sent from.
    </StyledNote>
  </StyledContainer>
);
