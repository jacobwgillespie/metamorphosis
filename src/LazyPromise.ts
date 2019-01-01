type Executor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
) => void

export class LazyPromise<T> implements Promise<T> {
  private _executor: Executor<T>
  private _promise: Promise<T> | null = null

  constructor(executor: Executor<T>) {
    this._executor = executor
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the LazyPromise.
   * @param onfulfilled The callback to execute when the LazyPromise is resolved.
   * @param onrejected The callback to execute when the LazyPromise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    this._promise = this._promise || new Promise(this._executor)
    return this._promise.then(onfulfilled, onrejected)
  }

  /**
   * Attaches a callback for only the rejection of the LazyPromise.
   * @param onrejected The callback to execute when the LazyPromise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    this._promise = this._promise || new Promise(this._executor)
    return this._promise.catch(onrejected)
  }

  [Symbol.toStringTag] = 'LazyPromise'
}
