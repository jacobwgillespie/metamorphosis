import {CustomError} from './CustomError'
import {isError} from './util'

interface FuturePromise<T> extends Promise<T> {
  resolve(value: T): void
  reject(error: any): void
}

function buildFuturePromise<T>(): FuturePromise<T> {
  const futurePromise: FuturePromise<T> = new Promise((resolve, reject) => {
    futurePromise.resolve = resolve
    futurePromise.reject = reject
  }) as FuturePromise<T>
  return futurePromise
}

export class IllegalStateException extends CustomError {}

export class Future<T> implements Promise<T> {
  private _completed = false
  private _promise = buildFuturePromise<T>()

  constructor() {
    this._promise
      .then(value => {
        this._completed = true
        return Promise.resolve(value)
      })
      .catch(error => {
        this._completed = true
        return Promise.reject(error)
      })
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Future.
   * @param onfulfilled The callback to execute when the Future is resolved.
   * @param onrejected The callback to execute when the Future is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected)
  }

  /**
   * Attaches a callback for only the rejection of the Future.
   * @param onrejected The callback to execute when the Future is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected)
  }

  complete(valueOrError: T | Error) {
    if (this._completed) {
      throw new IllegalStateException('Future already completed, cannot complete again')
    }

    if (isError(valueOrError)) {
      this._promise.reject(valueOrError)
    } else {
      this._promise.resolve(valueOrError)
    }
  }

  get completed() {
    return this._completed
  }

  completeWith(other: PromiseLike<T>) {
    other.then(
      value => {
        this.success(value)
      },
      error => {
        this.failure(error)
      },
    )
  }

  failure(error: any) {
    if (this._completed) {
      throw new IllegalStateException('Future already completed, cannot fail')
    }

    this._promise.reject(error)
  }

  success(value: T) {
    if (this._completed) {
      throw new IllegalStateException('Future already completed, cannot succeed')
    }

    this._promise.resolve(value)
  }

  [Symbol.toStringTag] = 'Promise' as 'Promise'
}
