import {toArray} from '../src/internal/toArray'

async function* source() {
  yield 1
  yield 2
  yield 3
}

test('1 == 1', async () => {
  expect(1).toBe(1)
  expect(await toArray(source())).toMatchSnapshot()
})
