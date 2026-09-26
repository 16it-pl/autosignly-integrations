import { isReachableFromInternet } from 'src/logic-functions/utils/build-relay-steps.util';

/**
 * The address to register, or undefined when there is none worth registering.
 *
 * An address Autosignly cannot reach is worse than no address: every delivery
 * fails and retries against it. Leaving it out keeps the CLI relay as the only
 * route, which is what a workspace on localhost actually wants.
 */
export const toRegistrableTarget = (webhookUrl: string): string | undefined =>
  isReachableFromInternet(webhookUrl) ? webhookUrl : undefined;

/**
 * Whether Autosignly refused because this environment is already registered.
 *
 * Told apart from every other rejection because it is not a fault: the
 * credentials work, only the one registration per environment is spent, and the
 * screen has to say so rather than show a failure.
 */
export const isAlreadyRegistered = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'statusCode' in error &&
  (error as { statusCode?: unknown }).statusCode === 409;
