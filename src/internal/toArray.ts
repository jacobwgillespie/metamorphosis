export async function toArray<T>(source: AsyncIterable<T>) {
  let results = [] as T[]
  for await (let item of source) {
    results.push(item)
  }
  return results
}
