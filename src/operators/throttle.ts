import {StreamOperator} from '../types'

export function throttle<TSource>(time: number): StreamOperator<TSource, TSource> {
  return async function*(source: AsyncIterable<TSource>) {
    let currentTime, previousTime

    for await (const item of source) {
      currentTime = Date.now()
      if (!previousTime || currentTime - previousTime > time) {
        previousTime = currentTime
        yield item
      }
    }
  }
}
