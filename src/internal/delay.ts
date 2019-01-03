import {sleep} from '../util'

export async function* delay<T>(source: AsyncIterable<T>, delayMs: number) {
  await sleep(delayMs)
  yield* source
}
