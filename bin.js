#!/usr/bin/env node
'use strict';
const Rapptor = require('rapptor');

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

const rapptor = new Rapptor();
rapptor.start();

// need to set this:
//   verbose: argv.verbose,
//   scripts: argv.scripts,
//   secret: argv.secret
