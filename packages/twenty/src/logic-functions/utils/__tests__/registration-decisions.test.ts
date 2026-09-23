import { describe, expect, it } from 'vitest';

import {
  isAlreadyRegistered,
  toRegistrableTarget,
} from 'src/logic-functions/utils/registration-decisions.util';

describe('toRegistrableTarget', () => {
  it('registers an address the internet can reach', () => {
    expect(toRegistrableTarget('https://crm.example.com/webhooks/server/x')).toBe(
      'https://crm.example.com/webhooks/server/x',
    );
  });

  it.each([
    ['localhost', 'http://localhost:3000/webhooks/server/x'],
    ['loopback', 'http://127.0.0.1:3000/webhooks/server/x'],
    ['private range', 'http://192.168.1.20:3000/webhooks/server/x'],
    ['bare hostname', 'http://twenty/webhooks/server/x'],
  ])('registers no address at all for %s', (_name, url) => {
    expect(toRegistrableTarget(url)).toBeUndefined();
  });
});

describe('isAlreadyRegistered', () => {
  it('recognises the conflict Autosignly answers with', () => {
    expect(isAlreadyRegistered({ statusCode: 409 })).toBe(true);
  });

  it.each([
    ['a validation error', { statusCode: 400 }],
    ['bad credentials', { statusCode: 401 }],
    ['a server fault', { statusCode: 500 }],
    ['an error without a status', new Error('socket hang up')],
    ['a string', 'nope'],
    ['null', null],
    ['undefined', undefined],
  ])('does not mistake %s for it', (_name, error) => {
    expect(isAlreadyRegistered(error)).toBe(false);
  });

  it('does not match a status that merely looks like it', () => {
    expect(isAlreadyRegistered({ statusCode: '409' })).toBe(false);
  });
});
