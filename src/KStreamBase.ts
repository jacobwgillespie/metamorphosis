import {Stream, Message} from './Stream'
import {Listener} from './Stream'
import {TopologyNode} from './Topology'

export interface KStreamBaseOptions {
  topology: TopologyNode
}

export class KStreamBase<K, V> {
  protected _options: KStreamBaseOptions
  protected _stream: Stream<K, V>

  constructor(options: KStreamBaseOptions) {
    this._options = options
    this._stream = new Stream()
  }

  protected _emit(message: Message<K, V>) {
    return this._stream.emit(message)
  }

  protected _subscribe(fn: Listener<K, V>) {
    return this._stream.subscribe(fn)
  }
}
