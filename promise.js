const PromiseState = '[[PromiseState]]'
const PromiseResult = '[[PromiseResult]]'

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

const queueTask = queueMicrotask

class Promise {
  [PromiseState] = PENDING;
  [PromiseResult] = undefined

  #onFulfilledCallBacks = []
  #onRejectedCallBacks = []
  #resolve = value => {
    if (this[PromiseState] === PENDING) {
      this[PromiseState] = FULFILLED
      this[PromiseResult] = value

      while (this.#onFulfilledCallBacks.length) {
        this.#onFulfilledCallBacks.shift()(this[PromiseResult])
      }
    }
  }
  #reject = reason => {
    if (this[PromiseState] === PENDING) {
      this[PromiseState] = REJECTED
      this[PromiseResult] = reason

      while (this.#onRejectedCallBacks.length) {
        this.#onRejectedCallBacks.shift()(this[PromiseResult])
      }
    }
  }

  constructor(executor) {
    executor(this.#resolve, this.#reject)
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    const promise = new Promise((resolve, reject) => {
      const resolved = () => {
        queueTask(() => {
          try {
            const x = onFulfilled(this[PromiseResult])

            resolvePromise(promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      const rejected = () => {
        queueTask(() => {
          try {
            const x = onRejected(this[PromiseResult])

            resolvePromise(promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      if (this[PromiseState] === FULFILLED) {
        resolved()
      }

      if (this[PromiseState] === REJECTED) {
        rejected()
      }

      if (this[PromiseState] === PENDING) {
        this.#onFulfilledCallBacks.push(resolved)
        this.#onRejectedCallBacks.push(rejected)
      }
    })

    return promise
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  if (isObject(x)) {
    var then

    try {
      then = x.then
    } catch (e) {
      reject(e)
    }

    if (typeof then === 'function') {
      var called = false

      try {
        then.call(
          x,
          y => {
            if (called) return
            called = true

            resolvePromise(promise, y, resolve, reject)
          },
          r => {
            if (called) return
            called = true

            reject(r)
          }
        )
      } catch (e) {
        if (called) return
        called = true

        reject(e)
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x)
  }
}

function isObject(value) {
  const type = typeof value

  return value !== null && (type === 'object' || type === 'function')
}

Promise.deferred = () => {
  const result = {}

  result.promise = new Promise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = Promise