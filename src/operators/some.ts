export function some<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
): ((source: AsyncIterable<T>) => Promise<boolean>)

export function some<T>(
  predicate: (value: T, index: number) => boolean | Promise<boolean>,
): ((source: AsyncIterable<T>) => Promise<boolean>)

export function some<T>(predicate: (value: T, index: number) => boolean | Promise<boolean>) {
  return async function(source: AsyncIterable<T>) {
    let i = 0
    for await (const item of source) {
      if (await predicate(item, i++)) {
        return true
      }
    }
    return false
  }
}
