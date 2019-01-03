import {Message} from './Stream'

export interface FilterPredicate<K, V> {
  (message: Message<K, V>): Promise<boolean>
}

export interface Action<K, V> {
  (message: Message<K, V>): Promise<void>
}

export interface KeyMapper<KNext, K, V> {
  (message: Message<K, V>): Promise<KNext>
}

export interface ValueMapper<VNext, K, V> {
  (message: Message<K, V>): Promise<VNext>
}

export interface FlatValueMapper<VNext, K, V> {
  (message: Message<K, V>): Promise<VNext[]>
}

export interface KeyValueMapper<KNext, VNext, K, V> {
  (message: Message<K, V>): Promise<Message<KNext, VNext>>
}

export interface FlatKeyValueMapper<KNext, VNext, K, V> {
  (message: Message<K, V>): Promise<Message<KNext, VNext>[]>
}

// new stuff

export interface NextObserver<T> {
  next: (value: T) => void | Promise<void>
  error?: (err: any) => void | Promise<void>
  complete?: () => void | Promise<void>
}

export interface ErrorObserver<T> {
  next?: (value: T) => void | Promise<void>
  error: (err: any) => void | Promise<void>
  complete?: () => void | Promise<void>
}

export interface CompletionObserver<T> {
  next?: (value: T) => void | Promise<void>
  error?: (err: any) => void | Promise<void>
  complete: () => void | Promise<void>
}

export type Observer<T> = NextObserver<T> | ErrorObserver<T> | CompletionObserver<T>
