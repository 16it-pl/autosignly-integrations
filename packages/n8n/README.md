# n8n-nodes-autosignly

An [n8n](https://n8n.io) community node for [Autosignly](https://autosignly.eu), a European
e-signature API. Send a PDF for signature, track it, and react to signing events — all through
n8n's own encrypted Credentials store. Nothing is stored by this package.

## Installation

In n8n: **Settings → Community Nodes → Install**, and enter `n8n-nodes-autosignly`.

Or, for a self-hosted instance: `npm install n8n-nodes-autosignly` inside your n8n custom
extensions folder (see n8n's
[community nodes docs](https://docs.n8n.io/integrations/community-nodes/installation/)).

## Credentials

### Autosignly API (used by the **Autosignly** node)

| Field | Where to get it |
|---|---|
| API Key / API Secret | Autosignly application → API keys. Each environment (production or sandbox) has its own pair, and the pair decides which environment your workflow talks to. |
| Base URL | Defaults to `https://app.autosignly.eu/api`. Only change it if Autosignly told you to use a different origin. |

Use **Test** on the credential to confirm it works and see which environment (`PROD` or
`SANDBOX`) it resolves to.

### Autosignly API (also used by the **Autosignly Trigger** node)

The Trigger node uses this same credential to register itself with Autosignly — see below.

### Autosignly Webhook Signing Key API (optional, used by the **Autosignly Trigger** node)

Activating the Trigger's workflow registers its webhook with Autosignly **automatically**, using
the Autosignly API credential above — nothing to copy or paste, for a fresh environment that has
never had a webhook registered before. This credential exists for the case that does not cover:

- **Autosignly already has a *different* webhook URL registered for this environment.**
  Registration works once per environment; Autosignly has no API to change it afterwards (by this
  node, or anything else — Zapier, Twenty, a script) or to recover a secret already issued. If
  activation fails for this reason, either update the URL in Autosignly's webhook settings to the
  one the failed activation reports, and generate a new signing key on the same page — or paste
  that key into this credential to manage it yourself, bypassing auto-registration entirely (a
  credential filled in here always takes over, whether or not auto-registration would otherwise
  succeed).
- **Local development**, where nothing here is reachable from Autosignly's servers in the first
  place — see the note on `autosignly listen` below.

The key table on that settings page is per environment (production/sandbox) and can hold several
named, simultaneously-valid keys, so a key can be rotated without downtime. If deliveries stop
arriving and nothing else changed, check that table isn't empty — switching to a different
Autosignly company/environment (e.g. picking up new sandbox API keys) does not carry the old
signing key over, and a delivery with no key to sign it likely never gets sent at all rather than
failing loudly.

## Nodes

### Autosignly

Resource | Operation | Notes
---|---|---
Document | Send for Signature | Uploads the PDF from a binary input field and sends it to the given signers in one call.
Document | Upload | Stores a PDF as a document without sending it — add attachments to it first, then send it.
Document | Send Existing Document for Signature | Sends a previously uploaded document (e.g. with attachments already added) to signers.
Document | Get | Fetches a document, its signers, and a fresh (short-lived) link to its file.
Document | Download | Downloads a document's current file as binary data. Works on a document still being signed — it then carries only the signatures collected so far.
Document | List | Lists documents, optionally filtered by status or tag.
Attachment | Add | Attaches a file (PDF/JPEG/PNG) to a document not yet sent for signing. Merges into the document's file, in the order added, behind an index page with a checksum.
Attachment | List | Lists a document's attachments.
Attachment | Download | Downloads one attachment as converted to PDF — the rendition that gets merged.
Attachment | Delete | Removes an attachment from a document not yet sent for signing.
Party | Create | Adds a counterparty (company or person) to the environment the credential points at.
Party | Get / Update / Delete | Standard CRUD on one party. Update replaces the whole party — send every field, not only what changed.
Party | List | Lists counterparties — useful to prefill signer details upstream of Send for Signature.
Tag | Set on Document | Replaces a document's whole tag set.
Tag | List / Create / Delete | Manage the company's tag pool directly, independent of any one document.
Reference | Get Signature Policy | The signature types and verification methods a given country's signers are allowed to use — what backs the Signers dropdowns below.
Reference | List SMS Countries | Countries an SMS verification code can be delivered to.

A signer needs at least `firstName`, `lastName`, `email` and a `country` (ISO 3166-1 alpha-2 —
it decides the applicable signature policy). `phoneNumber` (E.164) is required when that signer
is verified by SMS. **Signature Type** and **Signature Verification Method** are populated live
from Autosignly's own signature policy for the `country` you typed (`getSignaturePolicy`) —
type a country first, then open those dropdowns; a country that does not allow e.g. `QES` simply
will not offer it, rather than letting you pick it and fail at send time.

**Do not send the same source PDF for signature twice without checking first.** Two open
signing requests against what is conceptually the same document mean two live signing links —
two sources of truth for "is this signed yet". If your workflow might re-run over the same
input, check the document's status (Get, or List filtered by tag) before calling Send for
Signature again.

### Autosignly Trigger

Starts a workflow on an incoming webhook delivery. The raw request body and headers are passed
through as-is (`{ body, headers }`) — filter or route on whatever fields the delivery actually
carries with a Switch/IF node downstream.

The node verifies the delivery's HMAC signature (`X-Webhook-Signature` / `X-Webhook-Timestamp`)
against the raw, unparsed bytes of the request body before doing anything else, using the SDK's
`webhooks.verify()`. A modified body or a timestamp older than 5 minutes is rejected with
`401 Unauthorized` and never reaches your workflow.

A delivery's `body` looks like this (confirmed against a live sandbox delivery):

```json
{
  "eventId": "705d5dc2-6085-4563-b1ac-250b7862f41d",
  "application": "AUTO_DOKUMENTY",
  "companyId": "...",
  "eventType": "DOCUMENT_ALL_SIGNATURES_DONE",
  "payload": { "documentId": "...", "companyApiId": "..." }
}
```

Filter on `{{ $json.body.eventType }}`. Known event types: `DOCUMENT_SIGNED` (payload adds
`signerId`, `email`), `DOCUMENT_ALL_SIGNATURES_DONE`, `DOCUMENT_CANCELLED`, `DOCUMENT_RESTORED`.

## Known limitations

- **Webhook auto-registration only ever succeeds once per Autosignly environment, and cannot be
  changed by any API afterwards.** The first workflow activated against a given environment
  claims it; every other one (including a re-activation after Autosignly's config was changed
  manually) must use the manual credential instead — see above. This is deliberate on Autosignly's
  side, not a gap on ours: further changes go through Autosignly's own webhook settings page, by
  design.
- **No DECLINED/EXPIRED events yet.** Autosignly does not currently emit a webhook when a signer
  declines or a signing link expires. The Trigger node cannot react to either.
- **`DOCUMENT_ALL_SIGNATURES_DONE` fires after the closing seal, not the last signature.** It is
  sent once the document has been finalised and sealed, which happens shortly after — not at the
  same instant as — the last signer signing. Only after this event does `Download`/`Get` return
  the fully, finally signed file.
- **Sandbox sends no e-mail or SMS.** The signing link for whichever signer is currently awaiting
  their turn comes back as `sandboxSignUrl` in the node's own output (Send for Signature, Get).
  There is no such link in production: it authorises signing on its own, so the API never returns
  one there — each signer is e-mailed their own link when their turn comes.
- **An n8n instance behind NAT will not receive webhooks during local development.** Forward them
  with the `autosignly` CLI: `npx autosignly listen --forward-to <your local n8n webhook URL>`.
  This connects outbound to Autosignly (nothing needs to be publicly reachable) and relays events
  signed with the environment's webhook secret — you do not need to save a URL in Autosignly's
  webhook settings for this to work, just generate the signing secret and use it in n8n.

## Development

```bash
npm install
npm run dev     # runs n8n locally with this package linked in, watching for changes
npm run lint
npm run build
```

## Resources

- [Autosignly API documentation](https://docs.16it.eu/docs/autosignly/integrations/api)
- [Autosignly SDK](https://github.com/16it-pl/autosignly-sdk) (the `@16it/autosignly` package this
  node is built on)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

Licensed under Apache-2.0.
