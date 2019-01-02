import {StreamOperator} from '../types'

export function skipLast<TSource>(count: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    const items: TSource[] = []

    for await (const item of source) {
      items.push(item)
      if (items.length > count) {
        yield items.shift()!
      }
    }
  }
}
