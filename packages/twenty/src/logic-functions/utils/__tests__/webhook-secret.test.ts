import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const kvGet = vi.fn();

vi.mock('twenty-sdk/logic-function', () => ({
  kv: { get: kvGet, set: vi.fn() },
}));

const { getWebhookSecret } = await import(
  'src/logic-functions/utils/create-autosignly-client.util'
);

const REGISTERED = 'wh_registered';
const PASTED = 'wh_pasted';

describe('getWebhookSecret', () => {
  beforeEach(() => {
    kvGet.mockReset();
    delete process.env.AUTOSIGNLY_WEBHOOK_SECRET;
  });

  afterEach(() => {
    delete process.env.AUTOSIGNLY_WEBHOOK_SECRET;
  });

  it('uses the key stored at registration when nothing was pasted', async () => {
    kvGet.mockResolvedValue(REGISTERED);

    await expect(getWebhookSecret()).resolves.toBe(REGISTERED);
  });

  it('lets a pasted key override the one stored at registration', async () => {
    kvGet.mockResolvedValue(REGISTERED);
    process.env.AUTOSIGNLY_WEBHOOK_SECRET = PASTED;

    await expect(getWebhookSecret()).resolves.toBe(PASTED);
  });

  it('does not read the stored key at all once one is pasted', async () => {
    process.env.AUTOSIGNLY_WEBHOOK_SECRET = PASTED;

    await getWebhookSecret();

    expect(kvGet).not.toHaveBeenCalled();
  });

  it('falls back to the stored key when the pasted one is blank', async () => {
    kvGet.mockResolvedValue(REGISTERED);
    process.env.AUTOSIGNLY_WEBHOOK_SECRET = '   ';

    await expect(getWebhookSecret()).resolves.toBe(REGISTERED);
  });

  it('trims a pasted key, because a copy out of the panel carries whitespace', async () => {
    kvGet.mockResolvedValue(null);
    process.env.AUTOSIGNLY_WEBHOOK_SECRET = `  ${PASTED}\n`;

    await expect(getWebhookSecret()).resolves.toBe(PASTED);
  });

  it('refuses when neither key is there', async () => {
    kvGet.mockResolvedValue(null);

    await expect(getWebhookSecret()).rejects.toThrow('No webhook signing key');
  });

  it('refuses when the stored key is blank and nothing was pasted', async () => {
    kvGet.mockResolvedValue('  ');

    await expect(getWebhookSecret()).rejects.toThrow('No webhook signing key');
  });
});
