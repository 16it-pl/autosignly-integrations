/**
 * Turns a client error into something worth showing a person.
 *
 * The API answers with `errorType`, `errorId` and a fixed sentence telling you
 * to contact support; it carries no message of its own, by design, so nothing
 * describing what went wrong ever crosses the boundary. On its own that leaves
 * the user staring at "In case of UNKNOWN error, please contact support and
 * provide errorId" with no errorId in sight. The type and the id are the whole
 * of what the API will tell us, so both are passed on.
 */
export const describeAutosignlyError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Autosignly rejected the request.';
  }

  const { errorType, errorId } = error as { errorType?: string; errorId?: string };

  const cause = (error as { cause?: { code?: string; syscall?: string; address?: string; port?: number } }).cause;
  const network = cause?.code
    ? [cause.code, cause.syscall, cause.address, cause.port].filter(Boolean).join(' ')
    : undefined;

  const details = [
    errorType ? `type ${errorType}` : undefined,
    errorId ? `errorId ${errorId}` : undefined,
    network,
  ].filter((part): part is string => part !== undefined);

  return details.length > 0
    ? `${error.message} (${details.join(', ')})`
    : error.message;
};
