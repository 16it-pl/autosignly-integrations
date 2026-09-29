import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	...configWithoutCloudSupport,
	{
		// Two rules from n8n's Cloud-verification rule set stay on even with
		// cloud support "disabled" above, but neither can be satisfied here —
		// not from an oversight, but because of how this integration has to
		// work:
		//
		// - no-runtime-dependencies: this node depends on @16it/autosignly,
		//   the same client library packages/twenty in this repo uses, rather
		//   than reimplementing HTTP calls, retries, and typed errors again.
		// - webhook-lifecycle-complete (create/delete/checkExists): Autosignly
		//   has no API to register or remove a webhook. The user pastes the
		//   n8n webhook URL into the Autosignly UI by hand — see the
		//   package README — so there is nothing for lifecycle methods to
		//   call.
		//
		// Together with `"n8n": { "strict": false }` in package.json, this
		// means the package targets self-hosted "Install a community node"
		// installs, not n8n Cloud's verified badge.
		rules: {
			'@n8n/community-nodes/no-runtime-dependencies': 'off',
			'@n8n/community-nodes/webhook-lifecycle-complete': 'off',
			// This repository is Apache-2.0 throughout (see the root LICENSE);
			// n8n's lint otherwise insists on MIT for every community package.
			'n8n-nodes-base/community-package-json-license-not-default': 'off',
		},
	},
];
