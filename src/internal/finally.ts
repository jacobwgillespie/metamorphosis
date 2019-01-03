export async function* finallyDo<T>(source: AsyncIterable<T>, action: () => void | Promise<void>) {
  try {
    yield* source
  } finally {
    await action()
  }
}
