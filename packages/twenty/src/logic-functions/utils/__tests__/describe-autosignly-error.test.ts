import { describe, expect, it } from 'vitest';

import { describeAutosignlyError } from 'src/logic-functions/utils/describe-autosignly-error.util';

class ApiError extends Error {
  errorType?: string;
  errorId?: string;
}

describe('describeAutosignlyError', () => {
  it('should carry the type and the id the API does report', () => {
    // Without these the user is told to quote an errorId that was never shown.
    const error = new ApiError('In case of UNKNOWN error, please contact support and provide errorId');
    error.errorType = 'TECHNICAL_ERROR';
    error.errorId = '343d74ea-2f88-4bfa-bb01-b8bd887c63ee';

    expect(describeAutosignlyError(error)).toBe(
      'In case of UNKNOWN error, please contact support and provide errorId' +
        ' (type TECHNICAL_ERROR, errorId 343d74ea-2f88-4bfa-bb01-b8bd887c63ee)',
    );
  });

  it('should leave a plain error alone', () => {
    expect(describeAutosignlyError(new Error('Could not reach Autosignly'))).toBe(
      'Could not reach Autosignly',
    );
  });

  it('should report only what is present', () => {
    const error = new ApiError('Rejected');
    error.errorType = 'VALIDATION_ERROR';

    expect(describeAutosignlyError(error)).toBe('Rejected (type VALIDATION_ERROR)');
  });

  it('should fall back when something that is not an error is thrown', () => {
    expect(describeAutosignlyError('boom')).toBe('Autosignly rejected the request.');
  });
});

describe('describeAutosignlyError, network failures', () => {
  it('names the reason a connection never reached the API', () => {
    const error = new Error('fetch failed');

    (error as { cause?: unknown }).cause = {
      code: 'ENETUNREACH',
      syscall: 'connect',
      address: '104.21.53.12',
      port: 443,
    };

    expect(describeAutosignlyError(error)).toBe(
      'fetch failed (ENETUNREACH connect 104.21.53.12 443)',
    );
  });

  it('leaves a plain message alone when there is no cause', () => {
    expect(describeAutosignlyError(new Error('fetch failed'))).toBe('fetch failed');
  });
});
