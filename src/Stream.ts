import {AsyncEventEmitter, Listener as AsyncEventEmitterListener} from './AsyncEventEmitter'

export interface Message<K, V> {
  key: K
  value: V
}

export interface Listener<K, V> extends AsyncEventEmitterListener<Message<K, V>> {}

export class Stream<K, V> extends AsyncEventEmitter<Message<K, V>> {}
