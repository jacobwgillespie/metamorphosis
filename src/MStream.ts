import {RefCountedFuture} from './RefCountedFuture'
import {sleep} from './util'
import {CustomError} from './CustomError'

type TimeoutResult<TSource> = [false, IteratorResult<TSource>] | [true]

export class TimeoutError extends CustomError {
  constructor() {
    super()
    this.message = 'Stream timeout'
  }
}

export class MStream<T> implements AsyncIterable<T> {
  /** The number of consumers currently reading from this stream's shared iterator */
  private _consumerCount = 0

  /** Represents a future item to omit from this stream */
  private _itemFuture: RefCountedFuture<T>

  /** The Symbol ID of the shared iterator's lead consumer */
  private _leadConsumer: Symbol | null = null

  /** The source async iterable */
  private _source: AsyncIterable<T>

  /** The source async iterable's iterator, if this stream has been started */
  private _sourceIterator: AsyncIterator<T> | null = null

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

  filter<S extends T>(predicate: (value: T, index: number) => value is S): FilterMStream<T>
  filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): FilterMStream<T>
  filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): FilterMStream<T> {
    const source = this[Symbol.asyncIterator]()
    return new FilterMStream(
      (async function*() {
        let i = 0
        for await (const item of source) {
          if (await predicate(item, i++)) {
            yield item
          }
        }
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

  async last<S extends T>(
    predicate: (value: T, index: number) => value is S,
  ): Promise<S | undefined>
  async last(
    predicate?: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined>
  async last(
    predicate: (value: T, index: number) => boolean | Promise<boolean> = async () => true,
  ): Promise<T | undefined> {
    let i = 0
    let last: T | undefined

    for await (let item of this) {
      if (await predicate(item, i++)) {
        last = item
      }
    }

    return last
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

  skip(count: number) {
    const source = this[Symbol.asyncIterator]()
    return new SkipMStream(
      (async function*() {
        const it = source[Symbol.asyncIterator]()
        let i = count

        while (i > 0 && !(await it.next()).done) {
          i--
        }

        if (i <= 0) {
          let next
          while (!(next = await it.next()).done) {
            yield next.value
          }
        }
      })(),
    )
  }

  skipLast(count: number) {
    const source = this[Symbol.asyncIterator]()
    return new SkipLastMStream(
      (async function*() {
        const items: T[] = []

        for await (const item of source) {
          items.push(item)
          if (items.length > count) {
            yield items.shift()!
          }
        }
      })(),
    )
  }

  skipWhile(predicate: (value: T, index: number) => boolean | Promise<boolean>) {
    const source = this[Symbol.asyncIterator]()
    return new SkipWhileMStream(
      (async function*() {
        let skipping = true
        let i = 0

        for await (const item of source) {
          if (skipping && !(await predicate(item, i++))) {
            skipping = false
          }

          if (!skipping) {
            yield item
          }
        }
      })(),
    )
  }

  async some<S extends T>(predicate: (value: T, index: number) => value is S): Promise<boolean>
  async some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>
  async some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean> {
    const source = this[Symbol.asyncIterator]()
    let i = 0
    for await (const item of source) {
      if (await predicate(item, i++)) {
        return true
      }
    }
    return false
  }

  take(count: number) {
    const source = this[Symbol.asyncIterator]()
    return new TakeMStream(
      (async function*() {
        let i = count
        if (i > 0) {
          for await (let item of source) {
            yield item
            i -= 1
            if (i === 0) {
              break
            }
          }
        }
      })(),
    )
  }

  takeLast(count: number) {
    const source = this[Symbol.asyncIterator]()
    return new TakeLastMStream(
      (async function*() {
        if (count > 0) {
          const items: T[] = []
          for await (let item of source) {
            if (items.length >= count) {
              items.shift()
            }

            items.push(item)
          }

          yield* items
        }
      })(),
    )
  }

  takeWhile(predicate: (value: T, index: number) => boolean | Promise<boolean>) {
    const source = this[Symbol.asyncIterator]()
    return new TakeWhileMStream(
      (async function*() {
        let i = 0

        for await (const item of source) {
          if (!(await predicate(item, i++))) {
            break
          }
          yield item
        }
      })(),
    )
  }

  throttle(time: number) {
    const source = this[Symbol.asyncIterator]()
    return new ThrottleMStream(
      (async function*() {
        let currentTime, previousTime

        for await (const item of source) {
          currentTime = Date.now()
          if (!previousTime || currentTime - previousTime > time) {
            previousTime = currentTime
            yield item
          }
        }
      })(),
    )
  }

  timeout(time: number) {
    const source = this[Symbol.asyncIterator]()
    return new TimeoutMStream(
      (async function*() {
        while (true) {
          const [err, item] = await Promise.race([
            source.next().then(item => [false, item] as TimeoutResult<T>),
            sleep(time).then(() => [true] as TimeoutResult<T>),
          ])

          if (err) {
            throw new TimeoutError()
          }

          if (!item || item.done) {
            break
          }

          yield item.value
        }
      })(),
    )
  }

  async toArray() {
    let results = [] as T[]
    for await (let item of this) {
      results.push(item)
    }
    return results
  }

  [Symbol.toStringTag] = 'MStream'
}

export class DelayMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'DelayMStream'
}

export class FilterMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FilterMStream'
}

export class FlatMapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FlatMapMStream'
}

export class MapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'MapMStream'
}

export class SkipMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'SkipMStream'
}

export class SkipLastMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'SkipLastMStream'
}

export class SkipWhileMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'SkipWhileMStream'
}

export class TakeMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TakeMStream'
}

export class TakeLastMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TakeLastMStream'
}

export class TakeWhileMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TakeWhileMStream'
}

export class ThrottleMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'ThrottleMStream'
}

export class TimeoutMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TimeoutMStream'
}
