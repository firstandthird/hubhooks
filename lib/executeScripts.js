'use strict';
const async = require('async');
const path = require('path');
const runFirstExistingScript = require('./runFirstExistingScript');

module.exports = (dataToProcess, options, callback) => {
  async.autoInject({
    beforeHooks: done => runFirstExistingScript([
      path.join(options.scripts, 'hooks', dataToProcess.event, 'before'),
      path.join(options.scripts, 'hooks', 'before')
    ], dataToProcess, options, done),
    processResponse: (beforeHooks, done) => runFirstExistingScript([
      path.join(options.scripts, dataToProcess.event, `${dataToProcess.repo}-${dataToProcess.branch}`),
      path.join(options.scripts, dataToProcess.event, dataToProcess.repo),
      path.join(options.scripts, dataToProcess.event, 'default')
    ], dataToProcess, options, done),
    afterHooks: (processResponse, done) => runFirstExistingScript([
      path.join(options.scripts, 'hooks', dataToProcess.event, 'after'),
      path.join(options.scripts, 'hooks', 'after')
    ], dataToProcess, options, done),
  }, callback);
};
