'use strict';
const async = require('async');
const path = require('path');
const runFirstExistingScript = require('../lib/runFirstExistingScript');

module.exports = {
  method: (dataToProcess, options, callback) => {
    async.autoInject({
      beforeHooks: done => {
        runFirstExistingScript([
          path.join(options.scripts, 'hooks', dataToProcess.event, 'before'),
          path.join(options.scripts, 'hooks', 'before')
        ], dataToProcess, options, done);
      },
      processResponse: (beforeHooks, done) => {
        const paths = [];
        if (dataToProcess.repo) {
          if (dataToProcess.branch) {
            paths.push(path.join(options.scripts, dataToProcess.event, `${dataToProcess.repo}-${dataToProcess.branch}`));
          }
          paths.push(path.join(options.scripts, dataToProcess.event, dataToProcess.repo));
        }
        paths.push(path.join(options.scripts, dataToProcess.event, 'default'));
        paths.push(path.join(options.scripts, 'default'));
        runFirstExistingScript(paths, dataToProcess, options, done);
      },
      afterHooks: (processResponse, done) => {
        runFirstExistingScript([
          path.join(options.scripts, 'hooks', dataToProcess.event, 'after'),
          path.join(options.scripts, 'hooks', 'after')
        ], dataToProcess, options, done);
      }
    }, (err, results) => {
      // if it's a script error and not already the error hook, call the error hook:
      if (err) {
        options.log(['error'], err);
        return runFirstExistingScript([
          path.join(options.scripts, 'hooks', dataToProcess.event, 'error'),
          path.join(options.scripts, 'hooks', 'error')
        ], err, options, callback);
      }
      return callback(null, results);
    });
  }
};
