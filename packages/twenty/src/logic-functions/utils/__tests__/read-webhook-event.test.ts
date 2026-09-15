import { describe, expect, it } from 'vitest';

import {
  classifyWebhookEvent,
  readWebhookEvent,
} from 'src/logic-functions/utils/read-webhook-event.util';

describe('readWebhookEvent', () => {
  it('should read the shape the SDK fixtures use', () => {
    const event = readWebhookEvent({
      eventType: 'DOCUMENT_SIGNED',
      documentId: 'doc-1',
    });

    expect(event.eventType).toBe('DOCUMENT_SIGNED');
    expect(event.documentId).toBe('doc-1');
  });

  it('should accept a snake_case delivery', () => {
    const event = readWebhookEvent({
      event_type: 'document.signed',
      document_id: 'doc-2',
    });

    expect(event.eventType).toBe('document.signed');
    expect(event.documentId).toBe('doc-2');
  });

  it('should find the id nested under data', () => {
    const event = readWebhookEvent({
      eventType: 'DOCUMENT_SIGNED',
      data: { id: 'doc-3', email: 'ana@example.com' },
    });

    expect(event.documentId).toBe('doc-3');
    expect(event.signerEmail).toBe('ana@example.com');
  });

  it('should report a missing id as null rather than throwing', () => {
    const event = readWebhookEvent({ eventType: 'DOCUMENT_SIGNED' });

    expect(event.documentId).toBeNull();
  });

  it('should survive a body that is not an object', () => {
    expect(readWebhookEvent(null).eventType).toBe('');
    expect(readWebhookEvent('nope').documentId).toBeNull();
  });
});

describe('classifyWebhookEvent', () => {
  it.each([
    // One signature, not the whole document: the backend emits this per signer.
    ['DOCUMENT_SIGNED', 'signer-signed'],
    ['document.signed', 'signer-signed'],
    ['DOCUMENT_ALL_SIGNATURES_DONE', 'completed'],
    ['DOCUMENT_DECLINED', 'declined'],
    ['DOCUMENT_EXPIRED', 'expired'],
    ['SIGNER_SIGNED', 'signer-signed'],
    ['SOMETHING_ELSE', 'ignored'],
    ['', 'ignored'],
  ])('should classify %s as %s', (eventType, expected) => {
    expect(classifyWebhookEvent(eventType)).toBe(expected);
  });
});
