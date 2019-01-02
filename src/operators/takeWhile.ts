import {StreamOperator} from '../types'

export function takeWhile<TSource>(
  predicate: (value: TSource, index: number) => boolean | Promise<boolean>,
): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    let i = 0

    for await (const item of source) {
      if (!(await predicate(item, i++))) {
        break
      }
      yield item
    }
  }
}
