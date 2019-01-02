import {StreamOperator} from '../types'

export function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
): StreamOperator<T, S>

export function filter<T>(
  predicate: (value: T, index: number) => boolean | Promise<boolean>,
): StreamOperator<T, T>

export function filter<TSource>(
  predicate: (value: TSource, index: number) => boolean | Promise<boolean>,
): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    let i = 0
    for await (const item of source) {
      if (await predicate(item, i++)) {
        yield item
      }
    }
  }
}
