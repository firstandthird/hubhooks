#!/usr/bin/env node
'use strict';
const Server = require('./index.js');

const argv = require('yargs')
  .usage('Usage: $0 --scripts path/to/scripts --secret blah')
  .option('verbose', {
    describe: 'verbose syntax',
    default: false
  })
  .option('scripts', {
    describe: 'path to directory containing js scripts to execute when hook fires',
    default: process.cwd()
  })
  .option('secret', {
    describe: 'secret auth code used for decrypting the github packet signature'
  })
  .env()
  .argv;

const server = new Server({
  verbose: argv.verbose,
  scripts: argv.scripts,
  secret: argv.secret
});

server.start();
