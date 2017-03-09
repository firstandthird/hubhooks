#!/usr/bin/env node
'use strict';
const Rapptor = require('rapptor');

const argv = require('yargs')
  .usage('Usage: $0 --scripts path/to/scripts --secret blah')
  .option('verbose', {
    describe: 'verbose syntax',
    default: undefined
  })
  .option('scripts', {
    describe: 'path to directory containing js scripts to execute when hook fires',
    default: undefined
  })
  .option('secret', {
    describe: 'secret auth code used for decrypting the github packet signature',
    default: undefined
  })
  .env()
  .argv;

const rapptor = new Rapptor();
// set command-line options as relevant:
rapptor.start((err, server) => {
  if (err) {
    throw err;
  }
  if (argv.verbose !== undefined) {
    server.settings.app.verbose = argv.verbose;
  }
  if (argv.scripts !== undefined) {
    server.settings.app.scripts = argv.scripts;
  }
  if (argv.secret !== undefined) {
    server.settings.app.secret = argv.secret;
  }
});
