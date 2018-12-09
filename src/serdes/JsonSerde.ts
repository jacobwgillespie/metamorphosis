export class JsonSerde<T> {
  serialize(val: T) {
    return Buffer.from(JSON.stringify(val))
  }

  deserialize(val: Buffer) {
    return JSON.parse(val.toString('utf8')) as T
  }
}
