import 'twenty-ui/style.css';

import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import {
  copyToClipboard,
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  ROUTE_RECORD_SIGNATURES,
  ROUTE_REFRESH_REQUEST,
} from 'src/constants/route-paths.constant';
import { ActionButton } from 'src/front-components/components/ActionButton';
import { asRecord } from 'src/front-components/utils/as-record.util';
import { type FileSignature } from 'src/logic-functions/list-record-signatures';
import { type RecordContextObject } from 'src/logic-functions/utils/record-context.type';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[3]};
  padding: ${() => themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledCard = styled.div`
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[2]};
  padding: ${() => themeCssVariables.spacing[3]};
`;

const StyledFileName = styled.div`
  color: ${() => themeCssVariables.font.color.primary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  overflow-wrap: anywhere;
`;

const StyledMeta = styled.div`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
`;

const StyledBadge = styled.span<{ tone: 'done' | 'waiting' | 'bad' }>`
  background: ${({ tone }) =>
    tone === 'done'
      ? themeCssVariables.color.green
      : tone === 'bad'
        ? themeCssVariables.color.red
        : themeCssVariables.color.blue};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: #fff;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  padding: 1px 6px;
`;

const StyledSigners = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledSigner = styled.li`
  color: ${() => themeCssVariables.font.color.secondary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
`;

const StyledButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${() => themeCssVariables.spacing[2]};
`;

const StyledLinkButton = styled.a`
  background: ${() => themeCssVariables.color.blue};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: #fff;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  padding: 6px 12px;
  text-decoration: none;
`;

const StyledSearchRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${() => themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSearchInput = styled.input`
  background: ${() => themeCssVariables.background.primary};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: 4px;
  box-sizing: border-box;
  color: ${() => themeCssVariables.font.color.primary};
  flex: 1;
  font-size: 13px;
  padding: 6px 8px;
`;

const StyledEmpty = styled.div`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  padding: ${() => themeCssVariables.spacing[4]} 0;
  text-align: center;
`;

const toneOf = (status: string): 'done' | 'waiting' | 'bad' => {
  if (status === 'COMPLETED') return 'done';
  if (['DECLINED', 'EXPIRED', 'FAILED'].includes(status)) return 'bad';

  return 'waiting';
};

const asDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : null;

type RecordSignaturesProps = {
  objectType: RecordContextObject;
};

export const RecordSignatures = ({ objectType }: RecordSignaturesProps) => {
  const selectedRecordIds = useSelectedRecordIds();
  const recordId = selectedRecordIds.length === 1 ? selectedRecordIds[0] : null;

  const [signatures, setSignatures] = useState<FileSignature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Typing straight through would be one request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);

    return () => clearTimeout(timer);
  }, [search]);

  const load = async (options?: { after?: string }) => {
    if (!recordId) {
      setError('Select a single record first.');

      return;
    }

    try {
      const result = asRecord(
        await new RestApiClient().post(`/s${ROUTE_RECORD_SIGNATURES}`, {
          objectType,
          recordId,
          search: debounced || undefined,
          after: options?.after,
        }),
      );

      const page = (result.signatures as FileSignature[]) ?? [];

      setSignatures((previous) =>
        options?.after ? [...(previous ?? []), ...page] : page,
      );
      setHasNextPage(Boolean(result.hasNextPage));
      setCursor(
        typeof result.endCursor === 'string' ? result.endCursor : null,
      );
      setTotalCount(
        typeof result.totalCount === 'number' ? result.totalCount : page.length,
      );
      setError(result.success === false ? String(result.error) : null);
    } catch {
      setError('Could not read the signatures of this record.');
    }
  };

  useEffect(() => {
    void load();
  }, [recordId, objectType, debounced]);

  // Whose turn it is changes as people sign, and in a sandbox nothing is
  // emailed, so the link has to be asked for rather than waited for.
  const refresh = async (signature: FileSignature) => {
    setBusyId(signature.requestId);

    try {
      await new RestApiClient().post(`/s${ROUTE_REFRESH_REQUEST}`, {
        signatureRequestId: signature.requestId,
      });
      await load();
    } catch {
      enqueueSnackbar({
        message: 'Could not refresh this request.',
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return <StyledEmpty>{error}</StyledEmpty>;
  }

  const header = (
    <StyledSearchRow>
      <StyledSearchInput
        placeholder="Search by document name"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {signatures !== null && (
        <StyledMeta>
          {debounced
            ? `${signatures.length} matching`
            : `${signatures.length} of ${totalCount}`}
        </StyledMeta>
      )}
    </StyledSearchRow>
  );

  if (signatures === null) {
    return <StyledEmpty>Loading…</StyledEmpty>;
  }

  if (signatures.length === 0) {
    return (
      <StyledContainer>
        {header}
        <StyledEmpty>
          {debounced
            ? 'No document matches that.'
            : 'Nothing from this record has been sent for signature yet.'}
        </StyledEmpty>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      {header}
      {signatures.map((signature) => {
        const waiting = signature.signers.find(
          (signer) => signer.status !== 'SIGNED',
        );

        return (
          <StyledCard key={signature.requestId}>
            <StyledFileName>{signature.fileName}</StyledFileName>
            <StyledMeta>
              <StyledBadge tone={toneOf(signature.status)}>
                {signature.status}
              </StyledBadge>{' '}
              {signature.completedAt
                ? `finished ${asDate(signature.completedAt)}`
                : signature.sentAt
                  ? `sent ${asDate(signature.sentAt)}`
                  : ''}
            </StyledMeta>

            <StyledSigners>
              {signature.signers.map((signer) => (
                <StyledSigner key={signer.email}>
                  {`${signer.signingOrder ?? '?'}. ${signer.name || signer.email} — ${
                    signer.status === 'SIGNED'
                      ? `signed ${asDate(signer.signedAt) ?? ''}`
                      : signer.status.toLowerCase()
                  }`}
                </StyledSigner>
              ))}
            </StyledSigners>

            <StyledButtons>
              {signature.signingLink && (
                <StyledLinkButton
                  href={signature.signingLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {waiting
                    ? `Sign as ${waiting.email}`
                    : 'Open signing page'}
                </StyledLinkButton>
              )}
              {signature.signedDocumentUrl && (
                <StyledLinkButton
                  href={signature.signedDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Signed document
                </StyledLinkButton>
              )}
              {signature.status !== 'COMPLETED' && (
                <ActionButton
                  title={
                    busyId === signature.requestId ? 'Checking…' : 'Refresh'
                  }
                  variant="secondary"
                  disabled={busyId === signature.requestId}
                  onClick={() => {
                    void refresh(signature);
                  }}
                />
              )}
              {signature.signingLink && (
                <ActionButton
                  title="Copy link"
                  variant="secondary"
                  onClick={() => {
                    copyToClipboard(signature.signingLink ?? '');
                    enqueueSnackbar({
                      message: 'Signing link copied.',
                      variant: 'success',
                    });
                  }}
                />
              )}
            </StyledButtons>
          </StyledCard>
        );
      })}

      {hasNextPage && (
        <ActionButton
          title={isLoadingMore ? 'Loading…' : 'Load more'}
          variant="secondary"
          disabled={isLoadingMore}
          onClick={() => {
            setIsLoadingMore(true);
            void load({ after: cursor ?? undefined }).finally(() =>
              setIsLoadingMore(false),
            );
          }}
        />
      )}
    </StyledContainer>
  );
};
