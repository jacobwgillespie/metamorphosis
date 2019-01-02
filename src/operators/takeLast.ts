import {StreamOperator} from '../types'

export function takeLast<TSource>(count: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    if (count > 0) {
      const items: TSource[] = []
      for await (let item of source) {
        if (items.length >= count) {
          items.shift()
        }

        items.push(item)
      }

      yield* items
    }
  }
}
