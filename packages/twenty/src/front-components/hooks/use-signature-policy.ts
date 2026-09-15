import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import {
  ROUTE_SIGNATURE_POLICY,
  ROUTE_SMS_COUNTRIES,
} from 'src/constants/route-paths.constant';
import { asRecord } from 'src/front-components/utils/as-record.util';

export type AllowedSignatureType = {
  type?: string;
  verificationMethods: string[];
};

export type SmsCountry = {
  countryCode?: string;
  name?: string;
  dialingPrefix?: string;
};

/**
 * What Autosignly allows for one country.
 *
 * Read per signer, because the policy follows each signer's own country: a
 * combination the policy does not list is rejected when the document goes out.
 */
export const useSignaturePolicy = (country: string) => {
  const [signatureTypes, setSignatureTypes] = useState<AllowedSignatureType[]>(
    [],
  );
  const [policyError, setPolicyError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    if (country.length !== 2) {
      setSignatureTypes([]);
      setPolicyError(undefined);

      return;
    }

    const load = async () => {
      try {
        const result = asRecord(
          await new RestApiClient().post(`/s${ROUTE_SIGNATURE_POLICY}`, {
            country,
          }),
        );

        if (!cancelled) {
          setSignatureTypes(
            (result.signatureTypes as AllowedSignatureType[]) ?? [],
          );
          setPolicyError(
            result.success === false ? String(result.error) : undefined,
          );
        }
      } catch {
        if (!cancelled) {
          // Cleared, not left alone: the previous country's types would stay
          // selectable, and Autosignly only refuses the combination once the
          // request row already exists.
          setSignatureTypes([]);
          setPolicyError('Could not read the signature policy.');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [country]);

  return { signatureTypes, policyError };
};

/**
 * Countries an SMS code can be delivered to.
 *
 * The same for every signer, so it is read once and handed down. A number
 * outside the list is only refused when the signer asks for their code, long
 * after the document went out, which is why the form checks it up front.
 */
export const useSmsCountries = (): SmsCountry[] => {
  const [smsCountries, setSmsCountries] = useState<SmsCountry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = asRecord(
          await new RestApiClient().post(`/s${ROUTE_SMS_COUNTRIES}`, {}),
        );

        if (!cancelled) {
          setSmsCountries((result.countries as SmsCountry[]) ?? []);
        }
      } catch {
        // A missing list only disables the up-front check, never the send.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return smsCountries;
};
