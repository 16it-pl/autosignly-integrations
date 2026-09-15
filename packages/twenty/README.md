# Autosignly for Twenty

Send a document straight from a CRM record for electronic signature, and get the
signed PDF back on that same record.

Built on [Autosignly](https://autosignly.eu), a European e-signature API.
Pay as you go, no subscription, and free sandboxes so you can try the whole
flow before spending anything.

## What it does

- **Send for signature** from the command menu on a Person, Company or
  Opportunity. Pick one of the record's attachments, pick who signs, send.
- **Signer details are prefilled** from the record: name, email, phone, and the
  country taken from the phone number.
- **Only valid options are offered.** The signature levels and identity checks
  shown are the ones Autosignly actually allows for that signer's country, read
  live from the API.
- **Bad SMS numbers are caught before sending.** A number Autosignly cannot
  deliver a code to is normally only refused once the signer asks for the code,
  long after the document went out. This app blocks it in the form instead.
- **The attachment is replaced with the signed file**, after every signature,
  not only the last one. The file on the record is always the document as it
  has actually been signed so far, under the same name it went out with.
- **The signed PDF comes back automatically** and is attached to the signature
  request, along with the status of every signer.

## Setup

Three steps, and step 2 hands you what step 3 needs.

### 1. Paste your API credentials

In Autosignly, go to **Settings → API keys** and create a key. Copy the key and
the secret (the secret is shown once).

In Twenty, go to **Settings → Applications → Autosignly** and paste both into
**API key** and **API secret**.

Sandbox keys work here and cost nothing, so you can wire the whole thing up
against a sandbox environment first.

### 2. Get your webhook URL

Still in the Twenty settings panel, press **Check credentials and show URL**.

The app validates the credentials against Autosignly, tells you which company
and environment they belong to, and prints a webhook URL that looks like this:

```
https://your-twenty-server.com/webhooks/server/<id>?c=<token>
```

The token in that URL is what ties deliveries back to your workspace, so treat
the URL as private and do not share it between workspaces.

### 3. Register the URL and paste the signing key back

In Autosignly, go to **Settings → Webhooks**, add the URL from step 2, and copy
the signing key that Autosignly generates for it.

Back in Twenty, paste that value into **Webhook signing key**.

Until this is set, documents still go out for signature, but nothing comes
back: the app refuses deliveries it cannot verify.

## Trying it in a sandbox

Sandbox keys are free and work everywhere in this app. One difference matters:
**a sandbox sends no email and no SMS.**

So after you send, the panel does not just close. It shows an **Open signing
page** button with the signer's link, plus a copy button, and the same link is
saved on the signature request record. **Signature status** on the source record
shows it again for whoever is up next.

The settings panel tells you which environment your key belongs to, and warns
you in red when it is production.

Only the first signer gets a link immediately. The others are notified when
their turn comes, which in a sandbox means they are not notified at all.

## Running Twenty on your own machine

The webhook URL in step 2 is built from your Twenty server's own address, so a
Twenty running locally produces one that points at your machine:

```
http://localhost:2020/webhooks/server/<id>?c=<token>
```

Nothing outside your machine can reach that, which has two consequences.

**Production keys will not accept it.** Autosignly validates the URL when you
save the webhook, not when it first tries to deliver, and outside a sandbox it
requires https. So a locally running Twenty cannot be paired with production
Autosignly at all: the save is refused with `webhook URL must use https`. That
check is what keeps real deliveries off plain http, so work in a sandbox rather
than looking for a way around it.

**A sandbox accepts it**, and the CLI carries the events the rest of the way:

```bash
npm install -g autosignly
autosignly login
autosignly listen --forward-to "http://localhost:2020/webhooks/server/<id>?c=<token>"
```

Pass the URL exactly as the settings panel printed it, token and all. The token
is what tells the app which workspace a delivery belongs to, so an event
forwarded without it is dropped.

Leave `listen` running while you test. It prints every event as it arrives
together with the status your Twenty answered, which is usually enough to tell a
signature that never arrived from one that was rejected on the way in.

## Using it

1. Open a Person, Company or Opportunity that has a PDF attached.
2. Open the command menu and choose **Send for signature**.
3. Pick the attachment, check the signer, pick the signature level.
4. Send.

A **Signature request** record is created immediately and appears in the
Signature requests view and on the source record. As signers act, its status
moves through Sent, then Completed, Declined or Expired. On completion the
signed PDF is attached to it.

Each signature also overwrites the attachment it was sent from, so the file on
the record is the signed one rather than the draft that went out. The name does
not change. Keep a copy elsewhere first if you need the unsigned original.

The command also appears on your own custom objects, where it opens the same
form with the signer fields blank.

The **Signature requests** list itself is read-only: records are written by the
app as documents go out and as signatures come in, so there is nothing there
worth typing by hand and an edit would be overwritten by the next update from
Autosignly. Its **How to send a document** button says where requests come from.
Deleting a request still works.

## Requirements

- Twenty 2.40.0 or newer
- An Autosignly account ([autosignly.eu](https://autosignly.eu))

## Support

- Issues: https://github.com/16it-pl/autosignly-integrations/issues
- API documentation: https://docs.16it.eu/docs/autosignly/integrations/api
- Email: support@autosignly.eu

Licensed under Apache-2.0.
