import {StreamOperator} from '../types'

export function map<TSource, TResult>(
  selector: (value: TSource, index: number) => Promise<TResult> | TResult,
): StreamOperator<TSource, TResult> {
  return async function*(source: AsyncIterable<TSource>) {
    let i = 0
    for await (const item of source) {
      const result = await selector(item, i)
      yield result
    }
  }
}
