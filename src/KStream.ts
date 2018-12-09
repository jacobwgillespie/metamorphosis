import {Stream} from './Stream'
import {
  FilterPredicate,
  FlatKeyValueMapper,
  FlatValueMapper,
  Action,
  KeyValueMapper,
  ValueMapper,
  KeyMapper,
} from './types'
import {KGroupedStream} from './KGroupedStream'
import {KStreamBase, KStreamBaseOptions} from './KStreamBase'
import {KTable} from './KTable'
import {KeyValueStore} from './KeyValueStore'

export interface KStreamOptions extends KStreamBaseOptions {
  needsRepartition?: boolean
}

export class KStream<K, V> extends KStreamBase<K, V> {
  protected _options: KStreamOptions

  static _fromInternalStream<K, V>(stream: Stream<K, V>, opts: KStreamOptions) {
    const kstream = new KStream<K, V>(opts)
    stream.subscribe(message => kstream._emit(message))
    return kstream
  }

  constructor(options: KStreamOptions) {
    super(options)
    this._options = options
  }

  // This mess of TypeScript provides exact types for up to 10 arguments
  // passed to the `branch` function.
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>]): [KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V> ]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  // prettier-ignore
  branch(...predicates: [FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>, FilterPredicate<K, V>]): [KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>, KStream<K, V>]
  branch(...predicates: FilterPredicate<K, V>[]): KStream<K, V>[] {
    return predicates.map(predicate => {
      const nextStream = new KStream<K, V>(this._options)
      this._subscribe(async message => {
        if (await predicate(message)) {
          await nextStream._emit(message)
        }
      })
      return nextStream
    })
  }

  filter(predicate: FilterPredicate<K, V>) {
    const nextStream = new KStream<K, V>(this._options)
    this._subscribe(async message => {
      if (await predicate(message)) {
        await nextStream._emit(message)
      }
    })
    return nextStream
  }

  filterNot(predicate: FilterPredicate<K, V>) {
    return this.filter(async message => !(await predicate(message)))
  }

  flatMap<KNext, VNext>(mapper: FlatKeyValueMapper<KNext, VNext, K, V>) {
    const nextStream = new KStream<KNext, VNext>({...this._options, needsRepartition: true})
    this._subscribe(async message => {
      for (const nextMessage of await mapper(message)) {
        await nextStream._emit(nextMessage)
      }
    })
    return nextStream
  }

  flatMapValues<VNext>(mapper: FlatValueMapper<VNext, K, V>) {
    const nextStream = new KStream<K, VNext>(this._options)
    this._subscribe(async message => {
      for (const nextMessage of await mapper(message)) {
        await nextStream._emit({...message, value: nextMessage})
      }
    })
    return nextStream
  }

  forEach(action: Action<K, V>) {
    this._subscribe(action)
  }

  groupBy<KNext>(mapper: KeyMapper<KNext, K, V>) {
    const internalStream = new Stream<KNext, V>()
    const nextStream = KGroupedStream._fromInternalStream<KNext, V>(internalStream, this._options)
    this._subscribe(async message => internalStream.emit({...message, key: await mapper(message)}))
    return nextStream
  }

  groupByKey() {
    return KGroupedStream._fromInternalStream<K, V>(this._stream, this._options)
  }

  map<KNext, VNext>(mapper: KeyValueMapper<KNext, VNext, K, V>) {
    const nextStream = new KStream<KNext, VNext>({...this._options, needsRepartition: true})
    this._subscribe(async message => nextStream._emit({...message, ...(await mapper(message))}))
    return nextStream
  }

  mapValues<VNext>(mapper: ValueMapper<VNext, K, V>) {
    const nextStream = new KStream<K, VNext>(this._options)
    this._subscribe(async message => nextStream._emit({...message, value: await mapper(message)}))
    return nextStream
  }

  merge(otherStream: KStream<K, V>) {
    const nextStream = new KStream<K, V>(this._options)
    this._subscribe(message => nextStream._emit(message))
    otherStream._subscribe(message => nextStream._emit(message))
    return nextStream
  }

  peek(action: Action<K, V>) {
    this._subscribe(action)
    return this
  }

  selectKey<KNext>(mapper: KeyMapper<KNext, K, V>) {
    const nextStream = new KStream<KNext, V>({...this._options, needsRepartition: true})
    this._subscribe(async message => nextStream._emit({...message, key: await mapper(message)}))
    return nextStream
  }

  toTable(storage: KeyValueStore<K, V>) {
    return KTable._fromInternalStream(this._stream, {
      topology: this._options.topology,
      storage: storage,
    })
  }

  // through(topic)

  // to(topic)

  // transform(transformSupplier, stateStoreNames)

  // transformValues(valueTransformSupplier, stateStoreNames)

  // process(processSupplier, stateStoreNames)

  // join(otherStream, joiner, windows)

  // leftJoin(otherStream, joiner, windows)

  // outerJoin(otherStream, joiner, windows)
}
