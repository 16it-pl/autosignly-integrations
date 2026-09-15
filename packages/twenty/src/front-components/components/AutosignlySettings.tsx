import 'twenty-ui/style.css';

import styled from '@emotion/styled';
import { isUndefined } from '@sniptt/guards';
import { useState } from 'react';
import { copyToClipboard, enqueueSnackbar } from 'twenty-sdk/front-component';
import { Section } from 'twenty-ui/layout';

import { ActionButton } from 'src/front-components/components/ActionButton';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

import { ApplicationVariableRow } from 'src/front-components/components/ApplicationVariableRow';
import { useAppVariables } from 'src/front-components/hooks/use-application-variables';
import { useRegisterWebhook } from 'src/front-components/hooks/use-register-webhook';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[8]};
  width: 100%;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[4]};
`;

const StyledCentered = styled.div`
  align-items: center;
  color: ${() => themeCssVariables.font.color.tertiary};
  display: flex;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  justify-content: center;
  padding: ${() => themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledUrlBox = styled.code`
  background: ${() => themeCssVariables.background.secondary};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: ${() => themeCssVariables.font.color.primary};
  display: block;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  overflow-wrap: anywhere;
  padding: ${() => themeCssVariables.spacing[3]};
`;

const StyledNote = styled.p`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: ${() => themeCssVariables.spacing[2]} 0 0;
`;

const StyledError = styled(StyledNote)`
  color: ${() => themeCssVariables.font.color.danger};
`;

const StyledWarning = styled(StyledNote)`
  color: ${() => themeCssVariables.font.color.danger};
  font-weight: ${() => themeCssVariables.font.weight.medium};
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${() => themeCssVariables.spacing[2]};
  margin-top: ${() => themeCssVariables.spacing[3]};
`;

export const AutosignlySettings = () => {
  const {
    applicationId,
    applicationVariables,
    isApplicationVariablesQueryLoading,
    errorMessage,
  } = useAppVariables();

  const { registerWebhook, isRegistering, registration } = useRegisterWebhook();

  const [draftValueByVariableKey, setDraftValueByVariableKey] = useState<
    Record<string, string>
  >({});

  if (isApplicationVariablesQueryLoading) {
    return <StyledCentered>Loading settings…</StyledCentered>;
  }

  if (isUndefined(applicationId)) {
    return <StyledCentered>{errorMessage}</StyledCentered>;
  }

  return (
    <StyledContainer>
      <Section>
        <H2Title
          title="1. Autosignly credentials"
          description="Paste the API key and secret created in Autosignly. Sandbox keys work here and cost nothing."
        />
        <StyledList>
          {applicationVariables.map((variable) => (
            <ApplicationVariableRow
              key={variable.key}
              variable={variable}
              applicationId={applicationId}
              value={draftValueByVariableKey[variable.key]}
              onValueChange={({ variableKey, value }) =>
                setDraftValueByVariableKey((previous) => ({
                  ...previous,
                  [variableKey]: value,
                }))
              }
            />
          ))}
        </StyledList>
      </Section>

      <Section>
        <H2Title
          title="2. Webhook URL"
          description="Register this URL in Autosignly, then paste the signing key it gives you into the field above. Without it, signed documents never come back."
        />
        <StyledRow>
          <ActionButton
            title={
              isRegistering
                ? 'Checking…'
                : registration?.webhookUrl
                  ? 'Refresh'
                  : 'Check credentials and show URL'
            }
            disabled={isRegistering}
            onClick={() => {
              void registerWebhook();
            }}
          />
          {registration?.webhookUrl && (
            <ActionButton
              title="Copy"
              variant="secondary"
              onClick={() => {
                copyToClipboard(registration.webhookUrl ?? '');
                enqueueSnackbar({
                  message: 'Webhook URL copied.',
                  variant: 'success',
                });
              }}
            />
          )}
        </StyledRow>

        {registration?.error && <StyledError>{registration.error}</StyledError>}

        {registration?.webhookUrl && (
          <>
            <StyledNote>Paste this into Autosignly, Settings, Webhooks:</StyledNote>
            <StyledUrlBox>{registration.webhookUrl}</StyledUrlBox>
            <StyledNote>
              {`Connected to ${registration.environmentType ?? 'unknown'} environment ${
                registration.environmentId ?? ''
              }.`}
              {registration.isWebhookSecretSet
                ? ' Signing key is set.'
                : ' Signing key is still missing, add it above.'}
            </StyledNote>
            {registration.environmentType?.toUpperCase() === 'SANDBOX' ? (
              <StyledNote>
                This is a sandbox: no email and no SMS leave Autosignly.
                After sending, the panel shows the signing link so you can open
                it yourself, and it is saved on the signature request.
              </StyledNote>
            ) : (
              <StyledWarning>
                These are production credentials. Documents sent from this
                workspace are real, and signers will be emailed.
              </StyledWarning>
            )}
          </>
        )}
      </Section>
    </StyledContainer>
  );
};
