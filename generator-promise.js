const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function* timedNumbers() {
  console.log('doing work 1')
  await delay(2000)
  yield 1
  console.log('doing work 2')
  await delay(2000)
  yield 2
  console.log('doing work 3')
  await delay(2000)
  yield 3
  console.log('doing work 4')
  await delay(2000)
  yield 4
  console.log('doing work 5')
  await delay(2000)
  yield 5
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

class Future {
  constructor() {
    const _promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })

    this.catch = _promise.catch.bind(_promise)
    this.then = _promise.then.bind(_promise)
    this[Symbol.toStringTag] = 'Promise'
  }
}

class GeneratorPromise {
  constructor(generator) {
    this._generator = generator
    this._promise = new Future()
    this._done = false

    runGeneratorToPromise(this._generator)
      .then(val => {
        if (!this._done) {
          this._done = true
          this._promise.resolve(val)
        }
      })
      .catch(err => {
        if (!this._done) {
          this._done = true
          this._promise.reject(err)
        }
      })
  }

  then(...args) {
    return this._promise.then(...args)
  }

  catch(...args) {
    return this._promise.catch(...args)
  }

  cancel() {
    this._done = true
    this._generator.return()
    this._promise.reject(new Error('cancelled'))
  }
}

async function run() {
  const gp = new GeneratorPromise(timedNumbers())
  setTimeout(() => {
    gp.cancel()
  }, 4000)
  console.log('result', await gp)
}

run().catch(err => {
  console.log(err.stack)
  process.exit(1)
})
