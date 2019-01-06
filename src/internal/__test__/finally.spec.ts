import {finallyDo} from '../finally'
import {of} from '../of'
import {toArray} from '../toArray'

test('finally', async () => {
  const fn = jest.fn()
  await toArray(finallyDo(of(1, 2, 3), fn))
  await toArray(finallyDo(of(1, 2, 3), fn))
  await toArray(finallyDo(of(1, 2, 3), fn))
  expect(fn.mock.calls.length).toBe(3)
})
