export interface Subscription {
  closed: boolean
  unsubscribe(): void
}

export interface SubscriptionObserver<T> {
  closed: boolean
  next(value: T): void
  error(errorValue: any): void
  complete(): void
}

export interface Observer<T> {
  start?(subscription: Subscription): any
  next?(value: T): void
  error?(errorValue: any): void
  complete?(): void
}

export interface Subscriber<T> {
  (observer: SubscriptionObserver<T>): void | (() => void) | Subscription
}

// export class Observable<T> {
//   private _subscriber: Subscriber<T>

//   constructor(subscriber: Subscriber<T>) {
//     this._subscriber = subscriber
//   }

//   subscribe(
//     observerOrNext: ((value: T) => void) | Observer<T>,
//     error?: (error: any) => void,
//     complete?: () => void,
//   ) {}
// }
