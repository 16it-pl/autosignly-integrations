import { describe, expect, it } from 'vitest';

import { readSignedSigners } from 'src/logic-functions/utils/read-signed-signers.util';

const noEvent = { signerEmail: null, occurredAt: null };

describe('readSignedSigners', () => {
  it('should take each signer from their own signedAt', () => {
    const signed = readSignedSigners(
      [
        { email: 'anna@example.com', signedAt: '2026-05-06T09:31:14Z' },
        { email: 'jan@example.com' },
      ],
      noEvent,
    );

    expect(signed).toEqual([
      { email: 'anna@example.com', signedAt: '2026-05-06T09:31:14Z' },
    ]);
  });

  it('should mark nobody when the document reports no signature yet', () => {
    // This is the case that used to mark every signer as signed: outside a
    // sandbox nothing betrays whose turn it is, so the old inference fired on
    // the first delivery and stamped the whole list.
    const signed = readSignedSigners(
      [
        { email: 'anna@example.com' },
        { email: 'jan@example.com' },
      ],
      noEvent,
    );

    expect(signed).toEqual([]);
  });

  it('should trust the delivery when the document has not caught up', () => {
    const signed = readSignedSigners([{ email: 'anna@example.com' }], {
      signerEmail: 'anna@example.com',
      occurredAt: '2026-05-06T09:31:14Z',
    });

    expect(signed).toEqual([
      { email: 'anna@example.com', signedAt: '2026-05-06T09:31:14Z' },
    ]);
  });

  it('should not count one signer twice when both signals agree', () => {
    const signed = readSignedSigners(
      [{ email: 'Anna@Example.com', signedAt: '2026-05-06T09:31:14Z' }],
      { signerEmail: 'anna@example.com', occurredAt: '2026-05-06T10:00:00Z' },
    );

    expect(signed).toHaveLength(1);
    expect(signed[0].signedAt)
      // The document is the authority; the delivery only fills a gap.
      .toBe('2026-05-06T09:31:14Z');
  });

  it('should keep the address as the document spells it, for the filter', () => {
    const signed = readSignedSigners(
      [{ email: 'Anna@Example.com', signedAt: '2026-05-06T09:31:14Z' }],
      noEvent,
    );

    expect(signed[0].email).toBe('Anna@Example.com');
  });
});
