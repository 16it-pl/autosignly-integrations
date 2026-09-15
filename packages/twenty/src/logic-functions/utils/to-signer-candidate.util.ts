import { type SignerCandidate } from 'src/logic-functions/utils/record-context.type';

type PersonShape = {
  id?: string | null;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  emails?: { primaryEmail?: string | null } | null;
  phones?: {
    primaryPhoneNumber?: string | null;
    primaryPhoneCallingCode?: string | null;
    primaryPhoneCountryCode?: string | null;
  } | null;
};

// Twenty has no country field on Person, but the PHONES composite carries an
// ISO 3166-1 alpha-2 code alongside the number, which is the closest thing to
// a signer's country we can infer. The form always lets it be corrected.
export const toSignerCandidate = (
  person: PersonShape,
): SignerCandidate | null => {
  if (!person.id) {
    return null;
  }

  const callingCode = person.phones?.primaryPhoneCallingCode?.trim() ?? '';
  const nationalNumber = person.phones?.primaryPhoneNumber?.trim() ?? '';
  const phoneNumber = nationalNumber
    ? `${callingCode}${nationalNumber}`.replace(/[^+\d]/g, '')
    : null;

  return {
    personId: person.id,
    firstName: person.name?.firstName?.trim() ?? '',
    lastName: person.name?.lastName?.trim() ?? '',
    email: person.emails?.primaryEmail?.trim() ?? '',
    phoneNumber: phoneNumber && phoneNumber.startsWith('+') ? phoneNumber : null,
    country: person.phones?.primaryPhoneCountryCode?.trim()?.toUpperCase() || null,
  };
};

export const PERSON_CANDIDATE_SELECTION = {
  id: true,
  name: { firstName: true, lastName: true },
  emails: { primaryEmail: true },
  phones: {
    primaryPhoneNumber: true,
    primaryPhoneCallingCode: true,
    primaryPhoneCountryCode: true,
  },
} as const;
