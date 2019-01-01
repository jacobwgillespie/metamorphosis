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

class RefCountedFuture {
  constructor() {
    this._future = new Future()
    this._refs = []
  }

  resolve(val) {
    this._future.resolve(val)
    return Promise.all(this._refs)
  }

  wait() {
    const ref = new Future()
    this._refs.push(ref)
    return this._future.then(val => {
      ref.resolve()
      return val
    })
  }

  then(...args) {
    return this._future.then(...args)
  }
}

async function* producer() {
  console.log('starting a producer')
  let i = 0
  while (i < 20) {
    yield i++
  }
}

class Stream {
  constructor() {
    this.consumers = 0
    this.producer = producer()
    this.leader = null

    this.newValueFuture()
  }

  async *consume() {
    this.consumers += 1
    const instanceID = Symbol('instanceID')
    let leaderNext
    try {
      while (true) {
        if (this.consumers <= 0) {
          return
        }

        if (this.leader === null) {
          this.leader = instanceID
        }

        if (this.leader === instanceID) {
          leaderNext = await this.producer.next()
          if (!leaderNext.done) {
            yield leaderNext.value
            await this.valueFuture.resolve(leaderNext.value)
          } else {
            return
          }
        } else {
          yield this.valueFuture.wait()
        }
      }
    } finally {
      this.consumers -= 1
      const isLeader = this.leader === instanceID
      if (isLeader) {
        this.leader = null

        if (this.consumers > 0 && leaderNext && !leaderNext.done) {
          await this.valueFuture.resolve(leaderNext.value)
        }
      }
    }
  }

  newValueFuture() {
    const future = new RefCountedFuture()
    future.then(val => {
      this.newValueFuture()
      return val
    })
    this.valueFuture = future
  }
}

const stream = new Stream()

async function consumer(name, max) {
  for await (const i of stream.consume()) {
    if (i > max) return
    console.log(name, i)
  }
}

async function run() {
  await Promise.all([consumer('one', 5), consumer('two', 10), consumer('three', 7)])
}

run().catch(err => console.log(err))