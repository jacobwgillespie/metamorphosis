import {StreamOperator} from '../types'
import {sleep} from '../util'
import {CustomError} from '../CustomError'

type TimeoutResult<TSource> = [false, IteratorResult<TSource>] | [true]

export class TimeoutError extends CustomError {
  constructor() {
    super()
    this.message = 'Stream timeout'
  }
}

export function timeout<TSource>(time: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    const it = source[Symbol.asyncIterator]()

    while (true) {
      const [err, item] = await Promise.race([
        it.next().then(item => [false, item] as TimeoutResult<TSource>),
        sleep(time).then(() => [true] as TimeoutResult<TSource>),
      ])

      if (err) {
        throw new TimeoutError()
      }

      if (!item || item.done) {
        break
      }

      yield item.value
    }
  }
}
