export * from './errors'
export * from './Future'
export * from './MStream'
export * from './RefCountedFuture'
export * from './Task'
export * from './types'

import {MStream} from './MStream'
import {sleep} from './internal/_utils'

export async function* test() {
  for (let i = 0; i < 20; i++) {
    yield i
    await sleep(200)
  }
}

async function run() {
  const it = new MStream(test()).map(i => i * 2)

  for await (const item of it) {
    console.log(item)
  }
}

run().catch(console.log)
