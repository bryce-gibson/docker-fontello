var childProcess = require('child_process')
  , net = require('net')
  , _startFontelloTimeout = parseInt(process.env.STARTUP_TIMEOUT, 10)
  , startFontelloTimeout = isNaN(_startFontelloTimeout) ? 120e3 : _startFontelloTimeout
  , fontelloTimeout = setTimeout(function() { process.exit(2) }, startFontelloTimeout)

fontelloTimeout.unref()

var setupLogging = function(source) {
  source.stdout.pipe(process.stdout)
  source.stderr.pipe(process.stderr)
}

var mongod = childProcess.spawn('mongod', ['--nojournal', '--noprealloc'])
  , fontello = null

setupLogging(mongod)

var cleanupFunc = function(signal) {
  return function() {
    console.log('Cleaning up because ' + signal + ' received.')
    var killTimeout = setTimeout(function() {
      mongod.kill('SIGKILL')
      fontello && fontello.kill(signal)
      setTimeout(function() { process.exit(1) }, 50)
    }, 15e3)
    killTimeout.unref()
    mongod.kill(signal)
    fontello && fontello.kill(signal)
  }
}
var startFontello = function() {
  fontello = childProcess.spawn('./fontello.js')
  setupLogging(fontello)
}

console.log('Waiting for mongo.')
;(function waitForFontello() {
  var fontelloConnection = net.createConnection({ port: 27017 })

  fontelloConnection.on('connect', function() {
    console.log('Starting fontello.')
    clearTimeout(fontelloTimeout)
    startFontello()
    this.end()
  })
  fontelloConnection.on('error', function() {
    setTimeout(waitForFontello, 100)
  })
})()

;[ 'SIGINT', 'SIGTERM' ].forEach( function(signal) { process.on(signal, cleanupFunc(signal)) })

process.on('exit', function(code) {
  console.log('Manager process exiting')
})
