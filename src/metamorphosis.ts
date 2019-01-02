export * from './KeyValueStore'
export * from './KStream'
export * from './KTable'

export * from './Task'

export * from './operators'

import * as operators from './operators'
import {sleep} from './util'

export async function* test() {
  for (let i = 0; i < 20; i++) {
    yield i
    await sleep(1000)
  }
}

async function run() {
  console.log('starting')

  const it = operators.pipe(
    test(),
    operators.map(i => i),
    operators.skipLast(5),
  )

  for await (const item of it) {
    console.log(item)
  }
}

run().catch(console.log)
