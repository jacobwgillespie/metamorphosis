import {concat} from './internal/concat'
import {concatAll} from './internal/concatAll'
import {delay} from './internal/delay'
import {delayEach} from './internal/delayEach'
import {elementAt} from './internal/elementAt'
import {endWith} from './internal/endWith'
import {every} from './internal/every'
import {filter} from './internal/filter'
import {finallyDo} from './internal/finally'
import {find} from './internal/find'
import {findIndex} from './internal/findIndex'
import {first} from './internal/first'
import {flatMap} from './internal/flatMap'
import {last} from './internal/last'
import {map} from './internal/map'
import {reduce} from './internal/reduce'
import {skip} from './internal/skip'
import {skipLast} from './internal/skipLast'
import {skipWhile} from './internal/skipWhile'
import {some} from './internal/some'
import {take} from './internal/take'
import {takeLast} from './internal/takeLast'
import {takeWhile} from './internal/takeWhile'
import {tap} from './internal/tap'
import {throttle} from './internal/throttle'
import {timeout} from './internal/timeout'
import {toArray} from './internal/toArray'
import {RefCountedFuture} from './RefCountedFuture'
import {Observer} from './types'
import {of} from './internal/of'
import {fromArray} from './internal/fromArray'
import {fromPromise} from './internal/fromPromise'
import {fromIterable} from './internal/fromIterable'

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

  static fromArray<T>(array: ArrayLike<T>): FromArrayMStream<T> {
    return new FromArrayMStream(fromArray(array))
  }

  static fromIterable<T>(
    iterable: Iterable<T | PromiseLike<T>> | AsyncIterable<T>,
  ): FromIterableMStream<T> {
    return new FromIterableMStream(fromIterable(iterable))
  }

  static fromPromise<T>(promise: PromiseLike<T>): FromPromiseMStream<T> {
    return new FromPromiseMStream(fromPromise(promise))
  }

  static of<T>(...items: T[]): OfMStream<T> {
    return new OfMStream(of(...items))
  }

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

  concat(...sources: AsyncIterable<T>[]): ConcatMStream<T> {
    return new ConcatMStream(concat([this, ...sources]))
  }

  concatAll(this: MStream<AsyncIterable<T>>) {
    return new ConcatAllMStream(concatAll(this))
  }

  delay(delayMs: number): DelayMStream<T> {
    return new DelayMStream(delay(this, delayMs))
  }

  delayEach(delayMs: number): DelayEachMStream<T> {
    return new DelayEachMStream(delayEach(this, delayMs))
  }

  elementAt(index: number): Promise<T | undefined> {
    return elementAt(this, index)
  }

  endWith(...items: T[]): EndWithMStream<T> {
    return new EndWithMStream(endWith(this, ...items))
  }

  async every<S extends T>(predicate: (value: T, index: number) => value is S): Promise<boolean>
  async every(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>
  async every(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    return every(this, predicate)
  }

  filter<S extends T>(predicate: (value: T, index: number) => value is S): FilterMStream<S>
  filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): FilterMStream<T>
  filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): FilterMStream<T> {
    return new FilterMStream(filter(this, predicate))
  }

  finally(action: () => void | Promise<void>): FinallyMStream<T> {
    return new FinallyMStream(finallyDo(this, action))
  }

  async find<S extends T>(
    predicate: (value: T, index: number) => value is S,
  ): Promise<S | undefined>
  async find(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined>
  async find(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined> {
    return find(this, predicate)
  }

  async findIndex(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<number> {
    return findIndex(this, predicate)
  }

  async first<S extends T>(
    predicate: (value: T, index: number) => value is S,
  ): Promise<S | undefined>
  async first(
    predicate?: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined>
  async first(
    predicate?: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined> {
    return first(this, predicate)
  }

  flatMap<TResult>(
    selector: (value: T, index: number) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>,
  ): FlatMapMStream<TResult> {
    return new FlatMapMStream(flatMap(this, selector))
  }

  iterator(): AsyncIterableIterator<T> {
    return this[Symbol.asyncIterator]()
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
    return last(this, predicate)
  }

  map<TResult>(
    selector: (value: T, index: number) => Promise<TResult> | TResult,
  ): MapMStream<TResult> {
    return new MapMStream(map(this, selector))
  }

  async reduce<U = T>(
    accumulator: (previousValue: U, currentValue: T, currentIndex: number) => U | Promise<U>,
    initialValue?: never[],
  ): Promise<U>
  async reduce<U = T>(
    accumulator: (previousValue: U, currentValue: T, currentIndex: number) => U | Promise<U>,
    initialValue?: U,
  ): Promise<U>
  async reduce<U = T>(
    accumulator: (previousValue: U, currentValue: T, currentIndex: number) => U | Promise<U>,
    ...initialValue: U[]
  ): Promise<U> {
    return reduce(this, accumulator, ...initialValue)
  }

  skip(count: number): SkipMStream<T> {
    return new SkipMStream(skip(this, count))
  }

  skipLast(count: number): SkipLastMStream<T> {
    return new SkipLastMStream(skipLast(this, count))
  }

  skipWhile(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): SkipWhileMStream<T> {
    return new SkipWhileMStream(skipWhile(this, predicate))
  }

  async some<S extends T>(predicate: (value: T, index: number) => value is S): Promise<boolean>
  async some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>
  async some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean> {
    return some(this, predicate)
  }

  take(count: number): TakeMStream<T> {
    return new TakeMStream(take(this, count))
  }

  takeLast(count: number): TakeLastMStream<T> {
    return new TakeLastMStream(takeLast(this, count))
  }

  takeWhile(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): TakeWhileMStream<T> {
    return new TakeWhileMStream(takeWhile(this, predicate))
  }

  tap(observer: Observer<T>): TapMStream<T> {
    return new TapMStream(tap(this, observer))
  }

  throttle(time: number): ThrottleMStream<T> {
    return new ThrottleMStream(throttle(this, time))
  }

  timeout(time: number): TimeoutMStream<T> {
    return new TimeoutMStream(timeout(this, time))
  }

  async toArray(): Promise<T[]> {
    return toArray(this)
  }

  [Symbol.toStringTag] = 'MStream'
}

export class ConcatMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'ConcatMStream'
}

export class ConcatAllMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'ConcatAllMStream'
}

export class DelayMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'DelayMStream'
}

export class DelayEachMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'DelayEachMStream'
}

export class EndWithMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'EndWithMStream'
}

export class FilterMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FilterMStream'
}

export class FlatMapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FlatMapMStream'
}

export class FinallyMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FinallyMStream'
}

export class FromArrayMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FromArrayMStream'
}

export class FromIterableMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FromIterableMStream'
}

export class FromPromiseMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'FromPromiseMStream'
}

export class MapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'MapMStream'
}

export class OfMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'OfMStream'
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

export class TapMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TapMStream'
}

export class ThrottleMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'ThrottleMStream'
}

export class TimeoutMStream<T> extends MStream<T> {
  [Symbol.toStringTag] = 'TimeoutMStream'
}
