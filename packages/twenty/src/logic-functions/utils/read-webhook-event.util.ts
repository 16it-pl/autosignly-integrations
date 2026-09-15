export type AutosignlyWebhookEvent = {
  eventType: string;
  documentId: string | null;
  signerEmail: string | null;
  occurredAt: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const firstString = (
  source: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
};

// The delivered body is whatever Autosignly signed, and the only field we have
// seen for sure in the SDK fixtures is `eventType`. Several spellings of the
// document id are accepted so a naming difference does not silently drop
// every delivery; `documentId` is null when none matched, and the target logs
// the raw keys so the real name can be pinned down from one live delivery.
export const readWebhookEvent = (body: unknown): AutosignlyWebhookEvent => {
  const root = asRecord(body);
  const data = asRecord(root.data ?? root.document ?? root.payload);

  return {
    eventType:
      firstString(root, ['eventType', 'event_type', 'type', 'event']) ?? '',
    documentId:
      firstString(root, [
        'documentId',
        'document_id',
        'documentUuid',
        'documentID',
      ]) ?? firstString(data, ['documentId', 'document_id', 'id', 'uuid']),
    signerEmail:
      firstString(root, ['signerEmail', 'signer_email', 'email']) ??
      firstString(data, ['signerEmail', 'signer_email', 'email']),
    occurredAt:
      firstString(root, ['occurredAt', 'occurred_at', 'timestamp', 'createdAt']),
  };
};

// DOCUMENT_SIGNED fires once per signer, not once per document: the backend
// emits it for every signature and only adds DOCUMENT_ALL_SIGNATURES_DONE when
// the last one lands. Treating the former as completion marks a document done
// after the first signature.
const COMPLETED_EVENTS = [
  'DOCUMENT_ALL_SIGNATURES_DONE',
  'DOCUMENT_COMPLETED',
  'COMPLETED',
];
const DECLINED_EVENTS = ['DOCUMENT_DECLINED', 'DECLINED', 'REJECTED'];
const EXPIRED_EVENTS = ['DOCUMENT_EXPIRED', 'EXPIRED'];
const SIGNER_SIGNED_EVENTS = [
  'DOCUMENT_SIGNED',
  'SIGNER_SIGNED',
  'PARTY_SIGNED',
];

export type WebhookOutcome =
  | 'completed'
  | 'declined'
  | 'expired'
  | 'signer-signed'
  | 'ignored';

export const classifyWebhookEvent = (eventType: string): WebhookOutcome => {
  const normalized = eventType.toUpperCase().replace(/[.\s-]/g, '_');

  if (COMPLETED_EVENTS.includes(normalized)) return 'completed';
  if (DECLINED_EVENTS.includes(normalized)) return 'declined';
  if (EXPIRED_EVENTS.includes(normalized)) return 'expired';
  if (SIGNER_SIGNED_EVENTS.includes(normalized)) return 'signer-signed';

  return 'ignored';
};
