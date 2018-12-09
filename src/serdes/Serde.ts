export interface Serde<T> {
  serialize(val: T): Buffer
  deserialize(val: Buffer): T
}
