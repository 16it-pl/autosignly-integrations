import { CoreApiClient } from 'twenty-client-sdk/core';
import { describe, expect, it } from 'vitest';

import { SR_STATUS_PENDING } from 'src/constants/universal-identifiers';

// Runs against the instance the CLI spawns, so it proves the objects, fields
// and relations this app declares actually exist on a real server.
describe('signature request schema', () => {
  it('should create a signature request with its default status', async () => {
    const client = new CoreApiClient();

    const created = await client.mutation({
      createSignatureRequest: {
        __args: { data: { name: 'Integration test document' } },
        id: true,
        name: true,
        status: true,
      },
    });

    expect(created.createSignatureRequest?.id).toBeTruthy();
    expect(created.createSignatureRequest?.name).toBe(
      'Integration test document',
    );
    expect(created.createSignatureRequest?.status).toBe(SR_STATUS_PENDING);
  });

  it('should store the signing link a sandbox returns instead of emailing it', async () => {
    const client = new CoreApiClient();

    const created = await client.mutation({
      createSignatureRequest: {
        __args: {
          data: {
            name: 'Sandbox document',
            environment: 'SANDBOX',
            signingLink: {
              primaryLinkUrl: 'https://sign.example/abc',
              primaryLinkLabel: 'Sign as ana@example.com',
            },
          },
        },
        id: true,
        environment: true,
        signingLink: { primaryLinkUrl: true, primaryLinkLabel: true },
      },
    });

    expect(created.createSignatureRequest?.environment).toBe('SANDBOX');
    expect(created.createSignatureRequest?.signingLink?.primaryLinkUrl).toBe(
      'https://sign.example/abc',
    );
  });

  it('should attach a signer to a signature request', async () => {
    const client = new CoreApiClient();

    const request = await client.mutation({
      createSignatureRequest: {
        __args: { data: { name: 'Document with a signer' } },
        id: true,
      },
    });

    const signatureRequestId = request.createSignatureRequest?.id;

    expect(signatureRequestId).toBeTruthy();

    const signer = await client.mutation({
      createDocumentSigner: {
        __args: {
          data: {
            name: 'Ana Kowalska',
            email: 'ana@example.com',
            country: 'PL',
            signatureRequestId,
          },
        },
        id: true,
        email: true,
      },
    });

    expect(signer.createDocumentSigner?.email).toBe('ana@example.com');
  });
});
