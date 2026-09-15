import 'twenty-ui/style.css';

import styled from '@emotion/styled';
import { useMemo, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import {
  closeSidePanel,
  copyToClipboard,
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

import {
  ROUTE_REFRESH_REQUEST,
  ROUTE_SEND_FOR_SIGNATURE,
} from 'src/constants/route-paths.constant';
import { ActionButton } from 'src/front-components/components/ActionButton';
import {
  emptyRow,
  rowFromCandidate,
  SignerRow,
  type SignerRowState,
} from 'src/front-components/components/SignerRow';
import { useRecordContext } from 'src/front-components/hooks/use-record-context';
import { useSmsCountries } from 'src/front-components/hooks/use-signature-policy';
import { asRecord } from 'src/front-components/utils/as-record.util';
import { type RecordContextObject } from 'src/logic-functions/utils/record-context.type';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[6]};
  padding: ${() => themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledField = styled.label`
  color: ${() => themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  gap: 2px;
`;

const controls = `
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 13px;
  padding: 6px 8px;
  width: 100%;
`;

const StyledInput = styled.input`
  background: ${() => themeCssVariables.background.primary};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  color: ${() => themeCssVariables.font.color.primary};
  ${controls}
`;

const StyledSelect = styled.select`
  background: ${() => themeCssVariables.background.primary};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  color: ${() => themeCssVariables.font.color.primary};
  ${controls}
`;

const StyledRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[3]};
`;

const StyledWarning = styled.p`
  color: ${() => themeCssVariables.font.color.danger};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledHint = styled.p`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledLinkButton = styled.a`
  background: ${() => themeCssVariables.color.blue};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: #fff;
  display: inline-block;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  padding: 6px 12px;
  text-decoration: none;
`;

const StyledButtons = styled.div`
  display: flex;
  gap: ${() => themeCssVariables.spacing[2]};
`;

type SignerFormProps = {
  objectType: RecordContextObject;
};

export const SignerForm = ({ objectType }: SignerFormProps) => {
  const selectedRecordIds = useSelectedRecordIds();
  const recordId = selectedRecordIds.length === 1 ? selectedRecordIds[0] : null;

  const { isLoading, attachments, candidates, recordName, error } =
    useRecordContext(objectType, recordId);
  const smsCountries = useSmsCountries();

  // Nothing is picked to begin with: a preselected first file is the one people
  // send by accident, and the list is not ordered by anything meaningful.
  const [attachmentIndex, setAttachmentIndex] = useState(-1);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [rows, setRows] = useState<SignerRowState[] | null>(null);
  const [problems, setProblems] = useState<Record<string, string | null>>({});
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<{
    signatureRequestId?: string;
    signingUrl?: string;
    signerEmail?: string;
    environmentType?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // After one person signs, the link on screen is theirs and spent. This asks
  // Autosignly whose turn it is now, which in a sandbox is the only way the
  // next signer gets in: nothing is emailed there.
  const loadNextLink = async () => {
    if (!sent?.signatureRequestId) {
      return;
    }

    setIsRefreshing(true);

    try {
      const result = asRecord(
        await new RestApiClient().post(`/s${ROUTE_REFRESH_REQUEST}`, {
          signatureRequestId: sent.signatureRequestId,
        }),
      );

      const nextUrl =
        typeof result.signingUrl === 'string' ? result.signingUrl : undefined;

      if (nextUrl) {
        setSent({
          ...sent,
          signingUrl: nextUrl,
          signerEmail:
            typeof result.signerEmail === 'string'
              ? result.signerEmail
              : undefined,
        });
      } else {
        enqueueSnackbar({
          message: 'Everyone has signed, there is no link left to open.',
          variant: 'success',
        });
      }
    } catch {
      enqueueSnackbar({
        message: 'Could not read the next signing link.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const attachment =
    attachmentIndex >= 0 ? attachments[attachmentIndex] : undefined;

  // The first row starts on the record's own person, the natural signer; the
  // rest are added by hand.
  const signerRows =
    rows ??
    (candidates.length > 0
      ? [rowFromCandidate('row-0', candidates[0])]
      : [emptyRow('row-0')]);

  const updateRow = (updated: SignerRowState) =>
    setRows(signerRows.map((row) => (row.key === updated.key ? updated : row)));

  const addRow = () =>
    setRows([...signerRows, emptyRow(`row-${Date.now()}`)]);

  const removeRow = (key: string) => {
    setRows(signerRows.filter((row) => row.key !== key));
    setProblems((previous) => ({ ...previous, [key]: null }));
  };

  const rowProblem = useMemo(
    () => signerRows.map((row) => problems[row.key]).find(Boolean) ?? null,
    [signerRows, problems],
  );

  const blocker =
    error ??
    (attachments.length === 0 && !isLoading
      ? 'This record has no attachment that can be signed. Add a PDF first.'
      : null) ??
    (!attachment ? 'Choose the file to send.' : null) ??
    (attachment?.openSignatureRequestId
      ? 'This attachment is already out for signature. Pick another one, or wait for it to finish.'
      : null) ??
    rowProblem;

  const send = async () => {
    setIsSending(true);

    const name = documentName ?? attachment?.name ?? '';

    try {
      const result = asRecord(
        await new RestApiClient().post(`/s${ROUTE_SEND_FOR_SIGNATURE}`, {
          objectType,
          recordId,
          documentName: name,
          attachmentId: attachment?.id,
          attachmentName: attachment?.name,
          fileUrl: attachment?.fileUrl,
          signers: signerRows.map((row, index) => ({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            country: row.country,
            phoneNumber: row.phoneNumber || undefined,
            signatureType: row.signatureType || undefined,
            verificationMethod: row.verificationMethod || undefined,
            order: index + 1,
            personId:
              row.candidateId === 'manual' ? undefined : row.candidateId,
          })),
        }),
      );

      if (result.success) {
        enqueueSnackbar({
          message: `Sent "${name}" for signature.`,
          variant: 'success',
        });

        const signingUrl =
          typeof result.signingUrl === 'string' ? result.signingUrl : undefined;
        const environmentType =
          typeof result.environmentType === 'string'
            ? result.environmentType
            : undefined;

        // A sandbox sends no email and no SMS, so closing here would strand the
        // user with no way to reach the signing page.
        if (signingUrl) {
          setSent({
            signingUrl,
            environmentType,
            signatureRequestId:
              typeof result.signatureRequestId === 'string'
                ? result.signatureRequestId
                : undefined,
            signerEmail: signerRows[0]?.email,
          });
        } else {
          void closeSidePanel();
        }
      } else {
        enqueueSnackbar({
          message: String(result.error ?? 'Autosignly rejected the request.'),
          variant: 'error',
        });
      }
    } catch (sendError) {
      enqueueSnackbar({
        message:
          sendError instanceof Error
            ? sendError.message
            : 'Could not reach the Autosignly app function.',
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <StyledContainer>Loading…</StyledContainer>;
  }

  if (sent?.signingUrl) {
    const isSandbox = sent.environmentType?.toUpperCase() === 'SANDBOX';

    return (
      <StyledContainer>
        <Section>
          <H2Title
            title="Sent"
            description={
              isSandbox
                ? 'This is a sandbox, so no email or SMS was sent. Open the signing page yourself.'
                : 'The first signer has been emailed. You can also open their signing page directly.'
            }
          />
          <StyledLinkButton
            href={sent.signingUrl}
            target="_blank"
            rel="noreferrer"
          >
            {sent.signerEmail
              ? `Open signing page for ${sent.signerEmail}`
              : 'Open signing page'}
          </StyledLinkButton>
          <StyledHint>
            One signer at a time. When this one has signed, press “Next signer’s
            link”. The current link is also saved on the signature request.
          </StyledHint>
        </Section>
        <StyledButtons>
          <ActionButton
            title={isRefreshing ? 'Checking…' : 'Next signer’s link'}
            disabled={isRefreshing}
            onClick={() => {
              void loadNextLink();
            }}
          />
          <ActionButton
            title="Copy link"
            variant="secondary"
            onClick={() => {
              copyToClipboard(sent.signingUrl ?? '');
              enqueueSnackbar({
                message: 'Signing link copied.',
                variant: 'success',
              });
            }}
          />
          <ActionButton
            title="Close"
            variant="secondary"
            onClick={() => {
              void closeSidePanel();
            }}
          />
        </StyledButtons>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Section>
        <H2Title
          title="Document"
          description={recordName ? `From ${recordName}` : undefined}
        />
        <StyledField>
          Attachment
          <StyledSelect
            value={attachmentIndex}
            onChange={(event) => {
              setAttachmentIndex(Number(event.target.value));
              setDocumentName(null);
            }}
          >
            <option value={-1}>Choose a file…</option>
            {attachments.map((option, index) => (
              <option key={option.id} value={index}>
                {option.openSignatureRequestId
                  ? `${option.name} — already out for signature`
                  : option.name}
              </option>
            ))}
            {attachments.length === 0 && (
              <option value={-1}>No attachment found</option>
            )}
          </StyledSelect>
        </StyledField>
        <StyledField>
          Document name
          <StyledInput
            value={documentName ?? attachment?.name ?? ''}
            onChange={(event) => setDocumentName(event.target.value)}
          />
        </StyledField>
      </Section>

      <Section>
        <H2Title
          title="Signers"
          description="They sign in this order. Only the first is notified now; each next one when their turn comes."
        />
        <StyledRows>
          {signerRows.map((row, index) => (
            <SignerRow
              key={row.key}
              row={row}
              position={index + 1}
              candidates={candidates}
              smsCountries={smsCountries}
              canRemove={signerRows.length > 1}
              onChange={updateRow}
              onRemove={() => removeRow(row.key)}
              onProblemChange={(key, problem) =>
                setProblems((previous) =>
                  previous[key] === problem
                    ? previous
                    : { ...previous, [key]: problem },
                )
              }
            />
          ))}
        </StyledRows>
        <StyledButtons>
          <ActionButton
            title="Add another signer"
            variant="secondary"
            onClick={addRow}
          />
        </StyledButtons>
        <StyledHint>
          Country decides which signature levels Autosignly allows, and is
          prefilled from the phone number on the record.
        </StyledHint>
      </Section>

      {blocker && <StyledWarning>{blocker}</StyledWarning>}

      <ActionButton
        title={isSending ? 'Sending…' : 'Send for signature'}
        disabled={isSending || Boolean(blocker)}
        onClick={() => {
          void send();
        }}
      />
    </StyledContainer>
  );
};
