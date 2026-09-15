type SignedSigner = { email: string; signedAt: string };

/**
 * Who has actually signed, from two independent signals.
 *
 * `signedAt` on the document is the authority and covers a delivery that never
 * arrived; the e-mail on the delivery covers the moment before the document
 * reflects it. Both are recent additions to the API, so an app pointed at an
 * older Autosignly gets neither and marks nobody, which is the right way to be
 * wrong: inferring it from whose turn it is marked everyone signed the moment
 * the first person did, because the turn is only knowable in a sandbox.
 */
export const readSignedSigners = (
  signers: { email?: string; signedAt?: string }[],
  event: { signerEmail: string | null; occurredAt: string | null },
): SignedSigner[] => {
  const byEmail = new Map<string, SignedSigner>();

  for (const signer of signers) {
    if (signer.email && signer.signedAt) {
      byEmail.set(signer.email.toLowerCase(), {
        email: signer.email,
        signedAt: signer.signedAt,
      });
    }
  }

  if (event.signerEmail && !byEmail.has(event.signerEmail.toLowerCase())) {
    byEmail.set(event.signerEmail.toLowerCase(), {
      email: event.signerEmail,
      signedAt: event.occurredAt ?? new Date().toISOString(),
    });
  }

  return [...byEmail.values()];
};
