import {StreamOperator} from '../types'

export function flatMap<TSource, TResult>(
  selector: (
    value: TSource,
    index: number,
  ) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>,
): StreamOperator<TSource, TResult> {
  return async function*(source: AsyncIterable<TSource>) {
    let i = 0
    for await (const outerItem of source) {
      const innerSource = await selector(outerItem, i++)
      for await (const innerItem of innerSource) {
        yield innerItem
      }
    }
  }
}
