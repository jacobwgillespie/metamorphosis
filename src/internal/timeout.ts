import {sleep} from '../util'
import {TimeoutError} from '../errors'

type TimeoutResult<TSource> = [false, IteratorResult<TSource>] | [true]

export async function* timeout<T>(source: AsyncIterable<T>, time: number) {
  const it = source[Symbol.asyncIterator]()

  while (true) {
    const [err, item] = await Promise.race([
      it.next().then(item => [false, item] as TimeoutResult<T>),
      sleep(time).then(() => [true] as TimeoutResult<T>),
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