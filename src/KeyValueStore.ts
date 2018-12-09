export interface KeyValueStore<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
  has(key: K): boolean
  clear(key: K): void
}

export class SimpleMemoryKeyValueStore<K, V> implements KeyValueStore<K, V> {
  private _storage = new Map<K, V>()

  get(key: K) {
    return this._storage.get(key)
  }

  set(key: K, value: V) {
    this._storage.set(key, value)
  }

  has(key: K) {
    return this._storage.has(key)
  }

  clear(key: K) {
    this._storage.delete(key)
  }
}
