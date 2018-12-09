import {KeyValueStore} from './KeyValueStore'
import {KStream} from './KStream'
import {FilterPredicate, ValueMapper} from './types'
import {KStreamBase, KStreamBaseOptions} from './KStreamBase'
import {Stream} from './Stream'

export interface KTableOptions<K, V> extends KStreamBaseOptions {
  storage: KeyValueStore<K, V>
}

export class KTable<K, V> extends KStreamBase<K, V | undefined> {
  protected _options: KTableOptions<K, V>
  protected _storage: KeyValueStore<K, V>

  static _fromInternalStream<K, V>(stream: Stream<K, V | undefined>, opts: KTableOptions<K, V>) {
    const kstream = new KTable<K, V>(opts)
    stream.subscribe(message => kstream._emit(message))
    return kstream
  }

  constructor(options: KTableOptions<K, V>) {
    super(options)
    this._options = options
    this._storage = options.storage
  }

  filter(predicate: FilterPredicate<K, V | undefined>, storage: KeyValueStore<K, V>) {
    const nextKTable = new KTable<K, V>({...this._options, storage: storage})
    this._subscribe(async message =>
      nextKTable._emit(
        message.value == null || (await predicate(message))
          ? message
          : {key: message.key, value: undefined},
      ),
    )
    return nextKTable
  }

  filterNot(predicate: FilterPredicate<K, V | undefined>, storage: KeyValueStore<K, V>) {
    return this.filter(async message => !(await predicate(message)), storage)
  }

  join<VNext, VOther = unknown>(
    other: KTable<K, VOther>,
    joiner: (leftValue: V, rightValue: VOther) => Promise<VNext>,
    storage: KeyValueStore<K, VNext>,
  ) {
    const nextKTable = new KTable<K, VNext>({...this._options, storage: storage})
    this._subscribe(async message => {
      if (message.value == null) {
        await nextKTable._emit({...message, value: undefined})
      } else {
        const otherValue = other._storage.get(message.key)
        if (otherValue != null) {
          await nextKTable._emit({
            key: message.key,
            value: await joiner(message.value, otherValue),
          })
        }
      }
    })
    other._subscribe(async message => {
      if (message.value == null) {
        await nextKTable._emit({...message, value: undefined})
      } else {
        const ownValue = this._storage.get(message.key)
        if (ownValue != null) {
          await nextKTable._emit({
            key: message.key,
            value: await joiner(ownValue, message.value),
          })
        }
      }
    })
    return nextKTable
  }

  leftJoin<VNext, VOther = unknown>(
    other: KTable<K, VOther>,
    joiner: (leftValue: V, rightValue: VOther | undefined) => Promise<VNext>,
    storage: KeyValueStore<K, VNext>,
  ) {
    const nextKTable = new KTable<K, VNext>({...this._options, storage: storage})
    this._subscribe(async message => {
      if (message.value == null) {
        await nextKTable._emit({...message, value: undefined})
      } else {
        const otherValue = other._storage.get(message.key)
        await nextKTable._emit({
          key: message.key,
          value: await joiner(message.value, otherValue),
        })
      }
    })
    other._subscribe(async message => {
      const ownValue = this._storage.get(message.key)
      if (ownValue != null) {
        await nextKTable._emit({
          key: message.key,
          value: await joiner(ownValue, message.value),
        })
      }
    })
    return nextKTable
  }

  // groupBy()

  mapValues<VNext>(
    mapper: ValueMapper<VNext | undefined, K, V | undefined>,
    storage: KeyValueStore<K, VNext>,
  ) {
    const nextKTable = new KTable<K, VNext>({...this._options, storage: storage})
    this._subscribe(async message =>
      nextKTable._emit(
        message.value == null
          ? {...message, value: undefined}
          : {...message, value: await mapper(message)},
      ),
    )
    return nextKTable
  }

  outerJoin<VNext, VOther = unknown>(
    other: KTable<K, VOther>,
    joiner: (leftValue: V | undefined, rightValue: VOther | undefined) => Promise<VNext>,
    storage: KeyValueStore<K, VNext>,
  ) {
    const nextKTable = new KTable<K, VNext>({...this._options, storage: storage})
    this._subscribe(async message => {
      const otherValue = other._storage.get(message.key)
      await nextKTable._emit(
        message.value == null && otherValue == null
          ? {...message, value: undefined}
          : {
              key: message.key,
              value: await joiner(message.value, otherValue),
            },
      )
    })
    other._subscribe(async message => {
      const ownValue = this._storage.get(message.key)
      await nextKTable._emit(
        ownValue == null && message.value == null
          ? {...message, value: undefined}
          : {
              key: message.key,
              value: await joiner(ownValue, message.value),
            },
      )
    })
    return nextKTable
  }

  toStream() {
    return KStream._fromInternalStream(this._stream, {topology: this._options.topology})
  }
}
