const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function producer() {
  return {
    children: [],
    consume: async function*() {
      console.log('consume called')
      let i = 0
      while (true) {
        yield i++
        await delay(Math.round(Math.random() * 10))
      }
    },
  }
}

function findRoot(stream) {
  let rootStream = stream
  while (rootStream.parent) {
    rootStream = rootStream.parent
  }
  return rootStream
}

function runStream(stream) {
  const rootStream = findRoot(stream)
  const leaves = []

  const search = [rootStream]
  let node = rootStream
  while ((node = search.shift())) {
    if (node.children.length) {
      for (const child of node.children) {
        search.push(child)
      }
    } else {
      leaves.push(node)
    }
  }

  return Promise.all(leaves.map(leaf => leaf.run()))
}

function printStream(stream) {
  const root = findRoot(stream)

  const print = (stream, indent = '') => {
    const arrow = stream === root ? '' : '└─ '
    console.log(`${indent}${arrow}${stream.name}`)
    for (const child of stream.children) {
      print(child, `${indent}  `)
    }
  }

  print(root)
}

let nextID = 0

class Stream {
  constructor(source, parent, name = 'root') {
    this.id = nextID++
    this.name = `[${this.id}] ${name}`
    this.source = source
    this.parent = parent
    this.children = []

    if (parent) {
      this.parent.children.push(this)
    }
  }

  async run() {
    for await (const _msg of this.consume()) {
      // do nothing
    }
  }

  async *consume() {
    // while (true) {
    try {
      for await (const msg of this.source()) {
        const p = yield msg
        await p
      }
    } finally {
      return
    }
    // }
  }

  drain() {
    return this._childStream(async function*() {
      for await (const msg of this.consume()) {
        yield msg
      }
    }, 'drain')
  }

  filter(predicate) {
    return this._childStream(async function*() {
      for await (const msg of this.consume()) {
        if (await predicate(msg)) {
          yield msg
        }
      }
    }, 'filter')
  }

  fork() {
    if (this.children.length === 0) {
      this.drain()
    }
    return this._childStream(async function*() {
      for await (const msg of this.consume()) {
        yield msg
      }
    }, 'fork')
  }

  last() {
    return this._childStream(async function*() {
      let last = undefined
      for await (const next of this.consume()) {
        last = next
      }
      yield last
    }, 'last')
  }

  map(transform) {
    return this._childStream(async function*() {
      for await (const msg of this.consume()) {
        yield transform(msg)
      }
    }, 'map')
  }

  rename(name) {
    this.name = name
    return this
  }

  take(n) {
    return this._childStream(async function*() {
      if (n === 0) return

      let i = 0
      for await (const next of this.consume()) {
        yield next
        i += 1
        if (i >= n) {
          return
        }
      }
    }, `take(${n})`)
  }

  takeWhile(fn) {
    return this._childStream(async function*() {
      for await (const next of this.consume()) {
        if (await fn(next)) {
          yield next
        } else {
          return
        }
      }
    }, 'takeWhile')
  }

  tap(fn) {
    return this._childStream(async function*() {
      for await (const msg of this.consume()) {
        await fn(msg)
        yield msg
      }
    }, 'tap')
  }

  _childStream(iterator, name, parent = this) {
    return new Stream(iterator.bind(this), parent, name)
  }
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

const p = producer()

const stream = new Stream(p.consume, p)
  .tap(num => console.log('source', num))
  .map(i => i * 2)
  .filter(i => i % 4 === 0)

stream
  .take(20)
  .tap(num => console.log('take 20', num))
  .fork()
  .takeWhile(i => i < 20)
  .tap(num => console.log('less than 20', num))
  .last()
  .tap(l => console.log('last', l))

stream
  .take(1)
  .map(i => i * 10)
  .tap(num => console.log('take 1', num))

printStream(stream)

async function run() {
  await runStream(stream)
}

run().catch(err => console.error(err))
