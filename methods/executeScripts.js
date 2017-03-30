'use strict';
const async = require('async');
const path = require('path');
const runFirstExistingScript = require('../lib/runFirstExistingScript');

module.exports = {
  method: (dataToProcess, options, callback) => {
    async.autoInject({
      env_vars(done) {
        if (dataToProcess.ref_type !== null) {
          process.env.REF_TYPE = dataToProcess.ref_type;
        }
        return done();
      },
      beforeHooks: (env_vars, done) => {
        runFirstExistingScript([
          path.join(options.scripts, 'hooks', dataToProcess.event, 'before'),
          path.join(options.scripts, 'hooks', 'before')
        ], dataToProcess, options, done);
      },
      processResponse: (beforeHooks, done) => {
        console.log('process response')
        console.log('process response')
        console.log('process response')
        console.log('process response')
        console.log('process response')
        console.log(dataToProcess)
        const paths = [];
        if (dataToProcess.repo) {
          if (dataToProcess.branch) {
            paths.push(path.join(options.scripts, dataToProcess.event, `${dataToProcess.repo}-${dataToProcess.branch}`));
          }
          paths.push(path.join(options.scripts, dataToProcess.event, dataToProcess.repo));
        }
        paths.push(path.join(options.scripts, dataToProcess.event, 'default'));
        paths.push(path.join(options.scripts, 'default'));
        console.log('paths list:')
        console.log('paths list:')
        console.log('paths list:')
        console.log(paths)
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
