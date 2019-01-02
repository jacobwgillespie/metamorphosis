export * from './KeyValueStore'
export * from './KStream'
export * from './KTable'
export * from './MStream'
export * from './operators'
export * from './Task'

// import * as operators from './operators'
import {sleep} from './util'
import {MStream} from './MStream'

export async function* test() {
  for (let i = 0; i < 20; i++) {
    yield i
    await sleep(200)
  }
}

async function run() {
  console.log('starting')

  const it = new MStream(test()).map(i => i * 2)

  // operators.pipe(
  //   test(),
  //   operators.map(i => i),
  //   operators.skipLast(5),
  // )

  for await (const item of it) {
    console.log(item)
  }
}

run().catch(console.log)
