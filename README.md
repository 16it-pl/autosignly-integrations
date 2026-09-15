# Autosignly integrations

Open-source integrations that connect [Autosignly](https://autosignly.eu), a
European e-signature API, to the tools teams already work in.

Pay as you go, no subscription, free sandboxes.

## Packages

| Package | What it is | Status |
|---|---|---|
| [`packages/twenty`](packages/twenty) | App for [Twenty CRM](https://twenty.com): send a record's attachment for signature and get the signed PDF back | In development |

More connectors are planned. If you want one, open an issue.

## Working on an integration

Each package is self-contained and documents its own setup in its README.
The Twenty app needs Node 24 and Docker:

```bash
cd packages/twenty
yarn install
yarn twenty docker:start   # local Twenty on http://localhost:2020
yarn twenty dev            # build and sync the app into it
```

## Links

- Autosignly API documentation: https://docs.16it.eu/docs/autosignly/integrations/api
- Client SDKs (Node, Python, Java): https://github.com/16it-pl/autosignly-sdk
- Webhook forwarding CLI: `npm install -g autosignly`

Licensed under Apache-2.0.
