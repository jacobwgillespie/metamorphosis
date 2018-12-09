export interface Listener<T> {
  (data: T): Promise<void>
}

const listenersMap = new WeakMap<AsyncEventEmitter<any>, Set<Listener<any>>>()

function getListeners<T>(instance: AsyncEventEmitter<T>): Set<Listener<T>> {
  return listenersMap.get(instance) || new Set()
}

export class AsyncEventEmitter<T> {
  constructor() {
    listenersMap.set(this, new Set<Listener<T>>())
  }

  async emit(data: T) {
    const listeners = getListeners(this)
    const staticListeners = [...listeners]
    for (const listener of staticListeners) {
      await listener(data)
    }
  }

  subscribe(fn: Listener<T>) {
    getListeners(this).add(fn)
  }

  unsubscribe(fn: Listener<T>) {
    getListeners(this).delete(fn)
  }
}
