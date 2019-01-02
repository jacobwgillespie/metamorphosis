export function toArray<TSource>(source: AsyncIterable<TSource>) {
  return async function() {
    let results = [] as TSource[]
    for await (let item of source) {
      results.push(item)
    }
    return results
  }
}
