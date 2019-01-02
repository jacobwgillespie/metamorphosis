import {StreamOperator} from '../types'
import {sleep} from '../util'

export function delay<TSource>(timeMs: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    await sleep(timeMs)
    yield* source
  }
}
