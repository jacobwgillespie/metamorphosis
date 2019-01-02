import {StreamOperator} from '../types'

export function skip<TSource>(count: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    const it = source[Symbol.asyncIterator]()
    let i = count

    while (i > 0 && !(await it.next()).done) {
      i--
    }

    if (i <= 0) {
      let next
      while (!(next = await it.next()).done) {
        yield next.value
      }
    }
  }
}
