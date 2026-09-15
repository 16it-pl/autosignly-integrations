// Always an object, so callers can read fields without a null check on every
// access. The REST client types its result as unknown.
export const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
