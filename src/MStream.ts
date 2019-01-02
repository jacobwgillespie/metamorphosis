import {RefCountedFuture} from './RefCountedFuture'
import {sleep} from './util'

export class MStream<T> implements AsyncIterable<T> {
  private _consumerCount = 0
  private _source: AsyncIterable<T>
  private _sourceIterator: AsyncIterator<T> | null = null
  private _itemFuture: RefCountedFuture<T>
  private _leadConsumer: Symbol | null = null

  constructor(source: AsyncIterable<T>) {
    this._source = source
    this._leadConsumer = null
    this._itemFuture = new RefCountedFuture<T>()

    const setupSelfReplacingFuture = () => {
      this._itemFuture.then(val => {
        this._itemFuture = new RefCountedFuture<T>()
        setupSelfReplacingFuture()
        return val
      })
    }
    setupSelfReplacingFuture()
  }

  async *[Symbol.asyncIterator]() {
    this._consumerCount += 1

    if (this._sourceIterator === null) {
      this._sourceIterator = this._source[Symbol.asyncIterator]()
    }

    const instanceID = Symbol('instanceID')
    let leaderNext: IteratorResult<T> | undefined
    try {
      while (true) {
        if (this._consumerCount <= 0) {
          return
        }

        if (this._leadConsumer === null) {
          this._leadConsumer = instanceID
        }

        if (this._leadConsumer === instanceID) {
          leaderNext = await this._sourceIterator.next()
          if (leaderNext.done) {
            return
          }
          yield leaderNext.value
          await this._itemFuture.success(leaderNext.value)
        } else {
          yield this._itemFuture.wait()
        }
      }
    } finally {
      this._consumerCount -= 1
      if (this._leadConsumer === instanceID) {
        this._leadConsumer = null

        if (leaderNext && !leaderNext.done) {
          await this._itemFuture.success(leaderNext.value)
        }
      }
    }
  }

  delay(timeMs: number) {
    const source = this[Symbol.asyncIterator]()
    return new DelayMStream(
      (async function*() {
        await sleep(timeMs)
        yield* source
      })(),
    )
  }

  flatMap<TResult>(
    selector: (value: T, index: number) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>,
  ) {
    const source = this[Symbol.asyncIterator]()
    return new FlatMapMStream(
      (async function*() {
        let i = 0
        for await (const outerItem of source) {
          const innerSource = await selector(outerItem, i++)
          for await (const innerItem of innerSource) {
            yield innerItem
          }
        }
      })(),
    )
  }

  map<TResult>(selector: (value: T, index: number) => Promise<TResult> | TResult) {
    const source = this[Symbol.asyncIterator]()
    return new MapMStream(
      (async function*() {
        let i = 0
        for await (const item of source) {
          const result = await selector(item, i)
          yield result
        }
      })(),
    )
  }

  [Symbol.toStringTag] = 'MStream'
}

export class DelayMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'DelayMStream'
}

export class FlatMapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FlatMapMStream'
}

export class MapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'MapMStream'
}
