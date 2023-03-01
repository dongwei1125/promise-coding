const adapter = require('../promise.js')

describe('Promises/A+ Tests', function () {
  require('promises-aplus-tests').mocha(adapter)
})