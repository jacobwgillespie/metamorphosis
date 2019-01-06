import {throttle} from '../throttle'
import {toArray} from '../toArray'
import {sleep} from '../_utils'

test('throttle', async () => {
  const source = (async function*() {
    yield 1
    yield 2
    yield 3
    yield 4
    await sleep(10)
    yield 5
  })()

  expect(await toArray(throttle(source, 5))).toEqual([1, 5])
})
