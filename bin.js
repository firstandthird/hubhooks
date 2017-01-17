'use strict';
const Server = require('./index.js')

require('yargs')
  .usage('Usage: $0 --scripts path/to/scripts --secret blah')
  .option('scripts', {
    describe: 'path to directory containing js scripts to execute when hook fires'
  })
  .option('secret', {
    describe: 'secret auth signature that github will send'
  })
  .argv;

module.exports = Server;
