import { describe, expect, it } from 'vitest';

import {
  buildRelaySteps,
  isReachableFromInternet,
} from 'src/logic-functions/utils/build-relay-steps.util';

describe('isReachableFromInternet', () => {
  it.each([
    'http://localhost:2021/webhooks',
    'http://127.0.0.1:2021/webhooks',
    'http://twenty:2021/webhooks',
    'http://192.168.1.50/webhooks',
    'http://10.0.0.5/webhooks',
    'http://172.20.0.4/webhooks',
    'not a url',
  ])('rejects %s', (url) => {
    expect(isReachableFromInternet(url)).toBe(false);
  });

  it.each([
    'https://crm.klient.pl/webhooks',
    'https://8.8.8.8/webhooks',
    'https://twenty.example.com:3000/webhooks',
  ])('accepts %s', (url) => {
    expect(isReachableFromInternet(url)).toBe(true);
  });
});

describe('buildRelaySteps', () => {
  const webhookUrl = 'http://localhost:2021/webhooks/server/abc?claim=t';

  it('omits the api url flag when no endpoint override is set', () => {
    const steps = buildRelaySteps({ webhookUrl });

    expect(steps.map((step) => step.command)).toEqual([
      'npm install -g autosignly',
      'autosignly login',
      `autosignly listen --forward-to ${webhookUrl}`,
    ]);
  });

  it('puts the api url on both login and listen', () => {
    const apiUrl = 'https://regression-autodokumenty.16it.org/api';
    const steps = buildRelaySteps({ webhookUrl, apiUrl });

    expect(steps[1].command).toBe(`autosignly login --api-url ${apiUrl}`);
    expect(steps[2].command).toBe(
      `autosignly listen --forward-to ${webhookUrl} --api-url ${apiUrl}`,
    );
  });
});
