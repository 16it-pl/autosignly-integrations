import styled from '@emotion/styled';
import { useEffect, useMemo, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { ActionButton } from 'src/front-components/components/ActionButton';
import { usePeopleSearch } from 'src/front-components/hooks/use-people-search';
import {
  type SmsCountry,
  useSignaturePolicy,
} from 'src/front-components/hooks/use-signature-policy';
import { type SignerCandidate } from 'src/logic-functions/utils/record-context.type';

export type SignerRowState = {
  key: string;
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phoneNumber: string;
  signatureType: string;
  verificationMethod: string;
};

export const MANUAL_CANDIDATE = 'manual';

export const emptyRow = (key: string): SignerRowState => ({
  key,
  candidateId: MANUAL_CANDIDATE,
  firstName: '',
  lastName: '',
  email: '',
  country: '',
  phoneNumber: '',
  signatureType: '',
  verificationMethod: '',
});

export const rowFromCandidate = (
  key: string,
  candidate: SignerCandidate,
): SignerRowState => ({
  ...emptyRow(key),
  candidateId: candidate.personId,
  firstName: candidate.firstName,
  lastName: candidate.lastName,
  email: candidate.email,
  country: (candidate.country ?? '').toUpperCase(),
  phoneNumber: candidate.phoneNumber ?? '',
});

const StyledRow = styled.div`
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[2]};
  padding: ${() => themeCssVariables.spacing[3]};
`;

const StyledHeader = styled.div`
  align-items: center;
  color: ${() => themeCssVariables.font.color.tertiary};
  display: flex;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  justify-content: space-between;
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

const StyledGrid = styled.div`
  display: grid;
  gap: ${() => themeCssVariables.spacing[2]};
  grid-template-columns: 1fr 1fr;
`;

const StyledResults = styled.div`
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  max-height: 160px;
  overflow-y: auto;
`;

const StyledResult = styled.button`
  background: none;
  border: none;
  border-bottom: 1px solid ${() => themeCssVariables.border.color.light};
  color: ${() => themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  padding: 6px 8px;
  text-align: left;

  &:hover {
    background: ${() => themeCssVariables.background.transparent.light};
  }

  &:last-of-type {
    border-bottom: none;
  }
`;

const StyledResultEmail = styled.span`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-size: ${() => themeCssVariables.font.size.xs};
`;

const StyledHint = styled.p`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: 0;
`;

const StyledProblem = styled.p`
  color: ${() => themeCssVariables.font.color.danger};
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.xs};
  margin: 0;
`;

type SignerRowProps = {
  row: SignerRowState;
  position: number;
  candidates: SignerCandidate[];
  smsCountries: SmsCountry[];
  canRemove: boolean;
  onChange: (row: SignerRowState) => void;
  onRemove: () => void;
  onProblemChange: (key: string, problem: string | null) => void;
};

export const SignerRow = ({
  row,
  position,
  candidates,
  smsCountries,
  canRemove,
  onChange,
  onRemove,
  onProblemChange,
}: SignerRowProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, isSearching } = usePeopleSearch(searchTerm);
  const { signatureTypes, policyError } = useSignaturePolicy(row.country);

  const isTyping = searchTerm.trim().length >= 2;

  // Before anything is typed the record's own people are the likely signers;
  // after that the whole workspace is searched, because the other side of a
  // contract is rarely on the record it is sent from.
  const suggestions = isTyping ? results : candidates;

  const verificationMethods = useMemo(
    () =>
      signatureTypes.find((entry) => entry.type === row.signatureType)
        ?.verificationMethods ?? [],
    [signatureTypes, row.signatureType],
  );

  const set = (patch: Partial<SignerRowState>) => onChange({ ...row, ...patch });

  // Autosignly rejects a combination its policy does not list, so the first
  // allowed type is filled in as soon as the policy for this country arrives.
  useEffect(() => {
    if (signatureTypes.length === 0) {
      return;
    }

    const known = signatureTypes.some((entry) => entry.type === row.signatureType);

    if (!known) {
      onChange({
        ...row,
        signatureType: signatureTypes[0].type ?? '',
        verificationMethod: signatureTypes[0].verificationMethods[0] ?? '',
      });
    }
  }, [signatureTypes]);

  const isSms = row.verificationMethod.toUpperCase().includes('SMS');

  const problem = useMemo(() => {
    if (!row.email.includes('@')) {
      return 'An email address is required.';
    }

    if (row.country.length !== 2) {
      return 'A two-letter country code is required.';
    }

    if (!isSms) {
      return null;
    }

    if (!row.phoneNumber) {
      return 'SMS verification needs a phone number in international format.';
    }

    if (smsCountries.length === 0) {
      return null;
    }

    // Otherwise this is only refused when the signer asks for their code,
    // which is long after the document went out.
    const deliverable = smsCountries.some(
      (entry) => entry.dialingPrefix && row.phoneNumber.startsWith(entry.dialingPrefix),
    );

    return deliverable
      ? null
      : `Autosignly cannot deliver an SMS code to ${row.phoneNumber}.`;
  }, [row.email, row.country, row.phoneNumber, isSms, smsCountries]);

  useEffect(() => {
    onProblemChange(row.key, problem);
  }, [row.key, problem]);

  return (
    <StyledRow>
      <StyledHeader>
        <span>{`Signer ${position}`}</span>
        {canRemove && (
          <ActionButton title="Remove" variant="secondary" onClick={onRemove} />
        )}
      </StyledHeader>

      <StyledField>
        Find a person
        <StyledInput
          placeholder="Name or email"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </StyledField>

      {suggestions.length > 0 && (
        <StyledResults>
          {suggestions.map((candidate) => (
            <StyledResult
              key={candidate.personId}
              type="button"
              onClick={() => {
                onChange(rowFromCandidate(row.key, candidate));
                setSearchTerm('');
              }}
            >
              {`${candidate.firstName} ${candidate.lastName}`.trim() ||
                candidate.email}{' '}
              <StyledResultEmail>{candidate.email}</StyledResultEmail>
            </StyledResult>
          ))}
        </StyledResults>
      )}

      {isSearching && <StyledHint>Searching…</StyledHint>}
      {!isSearching && isTyping && suggestions.length === 0 && (
        <StyledHint>Nobody matches. Fill the fields in by hand.</StyledHint>
      )}

      <StyledGrid>
        <StyledField>
          First name
          <StyledInput
            value={row.firstName}
            onChange={(event) => set({ firstName: event.target.value })}
          />
        </StyledField>
        <StyledField>
          Last name
          <StyledInput
            value={row.lastName}
            onChange={(event) => set({ lastName: event.target.value })}
          />
        </StyledField>
      </StyledGrid>

      <StyledField>
        Email
        <StyledInput
          value={row.email}
          onChange={(event) => set({ email: event.target.value })}
        />
      </StyledField>

      <StyledGrid>
        <StyledField>
          Country
          <StyledInput
            maxLength={2}
            placeholder="PL"
            value={row.country}
            onChange={(event) =>
              set({
                country: event.target.value.toUpperCase(),
                signatureType: '',
                verificationMethod: '',
              })
            }
          />
        </StyledField>
        <StyledField>
          Phone
          <StyledInput
            placeholder="+48…"
            value={row.phoneNumber}
            onChange={(event) => set({ phoneNumber: event.target.value })}
          />
        </StyledField>
      </StyledGrid>

      <StyledGrid>
        <StyledField>
          Signature
          <StyledSelect
            value={row.signatureType}
            onChange={(event) => {
              const signatureType = event.target.value;

              // Refilled from what the new type allows rather than blanked: a
              // select whose value matches no option still renders the first
              // one, so an empty value shows an identity check nobody chose,
              // sends the signer without one, and skips the SMS number check
              // that hangs off it.
              set({
                signatureType,
                verificationMethod:
                  signatureTypes.find((entry) => entry.type === signatureType)
                    ?.verificationMethods[0] ?? '',
              });
            }}
          >
            {signatureTypes.map((entry) => (
              <option key={entry.type} value={entry.type}>
                {entry.type}
              </option>
            ))}
            {signatureTypes.length === 0 && (
              <option value="">Enter a country first</option>
            )}
          </StyledSelect>
        </StyledField>
        {verificationMethods.length > 0 && (
          <StyledField>
            Identity check
            <StyledSelect
              value={row.verificationMethod}
              onChange={(event) =>
                set({ verificationMethod: event.target.value })
              }
            >
              {verificationMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </StyledSelect>
          </StyledField>
        )}
      </StyledGrid>

      {policyError && <StyledProblem>{policyError}</StyledProblem>}
      {problem && <StyledProblem>{problem}</StyledProblem>}
    </StyledRow>
  );
};
