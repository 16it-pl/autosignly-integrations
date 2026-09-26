import 'twenty-ui/style.css';

import styled from '@emotion/styled';
import { isUndefined } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { copyToClipboard, enqueueSnackbar } from 'twenty-sdk/front-component';
import { Section } from 'twenty-ui/layout';

import { ActionButton } from 'src/front-components/components/ActionButton';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

import { ApplicationVariableRow } from 'src/front-components/components/ApplicationVariableRow';
import { useAppVariables } from 'src/front-components/hooks/use-application-variables';

const WEBHOOK_SECRET_VARIABLE_KEY = 'AUTOSIGNLY_WEBHOOK_SECRET';
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

const StyledRelayBox = styled.div`
  background: ${() => themeCssVariables.background.transparent.light};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  margin-top: ${() => themeCssVariables.spacing[3]};
  padding: ${() => themeCssVariables.spacing[3]};
`;

const StyledRelayTitle = styled.p`
  color: ${() => themeCssVariables.font.color.primary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledSteps = styled.ol`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: ${() => themeCssVariables.spacing[3]} 0 0;
  padding-left: ${() => themeCssVariables.spacing[4]};
`;

const StyledStep = styled.li`
  margin-bottom: ${() => themeCssVariables.spacing[3]};

  &:last-of-type {
    margin-bottom: 0;
  }
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

  useEffect(() => {
    // Reports where things stand. Registering waits for the button.
    void registerWebhook(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isApplicationVariablesQueryLoading) {
    return <StyledCentered>Loading settings…</StyledCentered>;
  }

  if (isUndefined(applicationId)) {
    return <StyledCentered>{errorMessage}</StyledCentered>;
  }

  const renderVariable = (variable: (typeof applicationVariables)[number]) => (
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
  );

  const credentialVariables = applicationVariables.filter(
    (variable) => variable.key !== WEBHOOK_SECRET_VARIABLE_KEY,
  );
  const signingKeyVariable = applicationVariables.find(
    (variable) => variable.key === WEBHOOK_SECRET_VARIABLE_KEY,
  );

  const isConnected = registration?.success === true;
  const isRegistered =
    registration?.didRegister === true ||
    registration?.wasAlreadyRegistered === true;

  return (
    <StyledContainer>
      <Section>
        <H2Title
          title="1. Connect to Autosignly"
          description="Paste the API key and secret created in Autosignly, then register this workspace for deliveries. Sandbox keys work here and cost nothing."
        />
        <StyledList>{credentialVariables.map(renderVariable)}</StyledList>

        <StyledRow>
          <ActionButton
            title={isRegistering ? 'Checking…' : 'Check and register'}
            disabled={isRegistering}
            onClick={() => {
              void registerWebhook(true);
            }}
          />
        </StyledRow>

        {registration?.error && <StyledError>{registration.error}</StyledError>}

        {isConnected && (
          <StyledNote>
            {`Connected to ${registration.environmentType ?? 'unknown'} environment ${
              registration.environmentId ?? ''
            }.`}
            {registration.didRegister
              ? ' Registered for every event, and the signing key is stored.'
              : registration.wasAlreadyRegistered
                ? ' This environment was already registered, so nothing changed.'
                : ' Not registered yet.'}
          </StyledNote>
        )}

        {registration?.wasAlreadyRegistered && !registration.isWebhookSecretSet && (
          <StyledWarning>
            Autosignly grants one registration per environment and this one is
            spent, so no key came back. Paste the signing key from the Autosignly
            panel below, or signed documents never return.
          </StyledWarning>
        )}

        {isRegistered && registration?.isRelayOnly && (
          <StyledRelayBox>
            <StyledRelayTitle>
              This workspace has no address Autosignly can reach.
            </StyledRelayTitle>
            <StyledNote>
              Nothing was registered as a destination, on purpose: deliveries to
              an unreachable address would only fail and retry. Run the relay
              instead, on a machine that can reach this workspace.
            </StyledNote>
            <StyledSteps>
              {(registration.relaySteps ?? []).map((step) => (
                <StyledStep key={step.command}>
                  <div>{step.label}</div>
                  <StyledUrlBox>{step.command}</StyledUrlBox>
                  <StyledRow>
                    <ActionButton
                      title="Copy"
                      variant="secondary"
                      onClick={() => {
                        copyToClipboard(step.command);
                        enqueueSnackbar({
                          message: 'Command copied.',
                          variant: 'success',
                        });
                      }}
                    />
                  </StyledRow>
                </StyledStep>
              ))}
            </StyledSteps>
          </StyledRelayBox>
        )}

        {isRegistered && !registration?.isRelayOnly && registration?.webhookUrl && (
          <>
            <StyledNote>Autosignly delivers to:</StyledNote>
            <StyledUrlBox>{registration.webhookUrl}</StyledUrlBox>
          </>
        )}

        {isConnected &&
          (registration.environmentType?.toUpperCase() === 'SANDBOX' ? (
            <StyledNote>
              This is a sandbox: no email and no SMS leave Autosignly. After
              sending, the panel shows the signing link so you can open it
              yourself, and it is saved on the signature request.
            </StyledNote>
          ) : (
            <StyledWarning>
              These are production credentials. Documents sent from this
              workspace are real, and signers will be emailed.
            </StyledWarning>
          ))}
      </Section>

      {signingKeyVariable && (
        <Section>
          <H2Title
            title="2. Webhook signing key"
            description="Registering above stores the key for you. Fill this in only when you registered from the Autosignly panel instead, or when you rotated the key there."
          />
          <StyledList>{renderVariable(signingKeyVariable)}</StyledList>
        </Section>
      )}
    </StyledContainer>
  );
};
