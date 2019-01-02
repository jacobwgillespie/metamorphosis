import {Future} from './Future'

const neverPromise = new Promise<never>(() => undefined)

async function runGeneratorToPromise<T>(generator: AsyncIterableIterator<T>) {
  let next = await generator.next()
  let last

  while (!next.done) {
    last = next
    next = await generator.next(next.value)
  }

  // If the generator never generates a value, return a never promise
  if (!last) {
    return neverPromise as Promise<T>
  }

  return last.value
}

function identity<T>(val: T) {
  return val
}

export class Task<T> implements Promise<T> {
  private _executor: AsyncIterableIterator<T>
  private _future: Future<T>
  private _done = false

  constructor(executor: AsyncIterableIterator<T>) {
    this._executor = executor
    this._future = new Future()
  }

  runAsync() {
    runGeneratorToPromise(this._executor)
      .then(val => {
        if (!this._done) {
          this._done = true
          this._future.success(val)
        }
      })
      .catch(err => {
        if (!this._done) {
          this._done = true
          this._future.failure(err)
        }
      })

    return this._future.then(identity)
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Task.
   * @param onfulfilled The callback to execute when the Task is resolved.
   * @param onrejected The callback to execute when the Task is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this._future.then(onfulfilled, onrejected)
  }

  /**
   * Attaches a callback for only the rejection of the Task.
   * @param onrejected The callback to execute when the Task is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this._future.catch(onrejected)
  }

  /**
   * Attaches a callback that is invoked when the Future is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Future is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this._future.finally(onfinally)
  }

  cancel() {
    this._done = true
    this._executor.return!()
    this._future.failure(new Error('cancelled'))
  }

  [Symbol.toStringTag] = 'Task'
}
