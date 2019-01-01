export function isError(val: unknown): val is Error {
  return val instanceof Error
}
