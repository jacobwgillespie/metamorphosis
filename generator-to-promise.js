async function* gen() {
  for (let i = 0; i < 10; i++) {
    const val = yield i
    // console.log('got val back', val)
  }
}

async function runGeneratorToPromise(generator) {
  let next = await generator.next()
  let last
  while (!next.done) {
    last = next
    next = await generator.next(next.value)
  }
  return last ? last.value : undefined
}

async function runFullGeneratorToPromise(generator) {
  let next = await generator.next()
  const values = []
  while (!next.done) {
    values.push(next.value)
    next = await generator.next(next.value)
  }
  return values
}

async function run() {
  console.log('from promise', await runGeneratorToPromise(gen()))
  console.log('from promise', await runFullGeneratorToPromise(gen()))
}

run().catch(console.log)
