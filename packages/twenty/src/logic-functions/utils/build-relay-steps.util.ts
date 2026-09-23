export type RelayStep = {
  label: string;
  command: string;
};

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

const IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export const isReachableFromInternet = (url: string): boolean => {
  let host: string;

  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) {
    return false;
  }

  if (!host.includes('.') && !host.includes(':')) {
    return false;
  }

  if (host === '::1' || host.startsWith('[')) {
    return false;
  }

  if (IPV4.test(host)) {
    return !PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(host));
  }

  return true;
};

export const buildRelaySteps = ({
  webhookUrl,
  apiUrl,
}: {
  webhookUrl: string;
  apiUrl?: string;
}): RelayStep[] => {
  const apiUrlFlag = apiUrl ? ` --api-url ${apiUrl}` : '';

  return [
    {
      label: 'Install the relay. Needs Node 20 or newer.',
      command: 'npm install -g autosignly',
    },
    {
      label: 'Sign in with the same API key and secret you entered above.',
      command: `autosignly login${apiUrlFlag}`,
    },
    {
      label: 'Start it and leave it running while you sign.',
      command: `autosignly listen --forward-to ${webhookUrl}${apiUrlFlag}`,
    },
  ];
};
