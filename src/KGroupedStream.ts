import {KStreamBase, KStreamBaseOptions} from './KStreamBase'
import {Stream} from './Stream'

export interface KGroupedStreamOptions extends KStreamBaseOptions {}

export class KGroupedStream<K, V> extends KStreamBase<K, V> {
  protected _options: KGroupedStreamOptions

  static _fromInternalStream<K, V>(stream: Stream<K, V>, opts: KGroupedStreamOptions) {
    const kstream = new KGroupedStream<K, V>(opts)
    stream.subscribe(message => kstream._emit(message))
    return kstream
  }

  constructor(options: KGroupedStreamOptions) {
    super(options)
    this._options = options
  }
}
