import {StreamOperator} from '../types'

export function take<TSource>(count: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    let i = count
    if (i > 0) {
      for await (let item of source) {
        yield item
        i -= 1
        if (i === 0) {
          break
        }
      }
    }
  }
}
