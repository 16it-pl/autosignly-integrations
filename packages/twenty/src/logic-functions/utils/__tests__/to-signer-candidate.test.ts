import { describe, expect, it } from 'vitest';

import { toSignerCandidate } from 'src/logic-functions/utils/to-signer-candidate.util';

describe('toSignerCandidate', () => {
  it('should build an E.164 number and take the country from the phone', () => {
    const candidate = toSignerCandidate({
      id: 'p1',
      name: { firstName: 'Ana', lastName: 'Kowalska' },
      emails: { primaryEmail: 'ana@example.com' },
      phones: {
        primaryPhoneNumber: '601234567',
        primaryPhoneCallingCode: '+48',
        primaryPhoneCountryCode: 'pl',
      },
    });

    expect(candidate).toEqual({
      personId: 'p1',
      firstName: 'Ana',
      lastName: 'Kowalska',
      email: 'ana@example.com',
      phoneNumber: '+48601234567',
      country: 'PL',
    });
  });

  it('should return no phone when the calling code is missing', () => {
    const candidate = toSignerCandidate({
      id: 'p2',
      phones: { primaryPhoneNumber: '601234567' },
    });

    expect(candidate?.phoneNumber).toBeNull();
  });

  it('should return no country when the record has no phone', () => {
    const candidate = toSignerCandidate({
      id: 'p3',
      emails: { primaryEmail: 'b@example.com' },
    });

    expect(candidate?.country).toBeNull();
    expect(candidate?.email).toBe('b@example.com');
  });

  it('should skip a person without an id', () => {
    expect(toSignerCandidate({})).toBeNull();
  });
});
