import {StreamOperator} from '../types'

export function skipWhile<TSource>(
  predicate: (value: TSource, index: number) => boolean | Promise<boolean>,
): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    let skipping = true
    let i = 0

    for await (const item of source) {
      if (skipping && !(await predicate(item, i++))) {
        skipping = false
      }

      if (!skipping) {
        yield item
      }
    }
  }
}
