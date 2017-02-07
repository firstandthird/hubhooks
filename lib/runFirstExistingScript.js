'use strict';
const async = require('async');
const fs = require('fs');
const runshell = require('runshell');
const path = require('path');

// might remove to its own lib for re-use:

const runFirstExistingScript = (fileList, data, options, callback) => {
  async.detectSeries(fileList, (pathname, detectCallback) => {
    fs.exists(pathname, (pathExists) => detectCallback(null, pathExists));
  }, (err, existingScript) => {
    // if an error:
    if (err) {
      return callback(err);
    }
    // if none exist:
    if (!existingScript) {
      return callback('no matching paths exist for:');
    }
    if (options.verbose) {
      options.log(['hubhooks', 'notice'], `running ${existingScript}`);
    }
    // todo: does this pass any params to the script?
    runshell(existingScript, {
      env: process.env,
      // args: JSON.stringify(data)
    }, (scriptErr, stdio, stderr) => {
      // if it's not an error and not already the error hook, call the error hook:
      if (scriptErr && fileList.indexOf(path.join(options.scripts, 'hooks', 'error')) < 0) {
        return runFirstExistingScript([
          path.join(options.scripts, 'hooks', data.event, 'error'),
          path.join(options.scripts, 'hooks', 'error')
        ], scriptErr, options, callback);
      }
      if (options.verbose) {
        options.log(['hubhooks', 'notice', existingScript], stdio);
      }
      callback(null, existingScript);
    });
  });
};

module.exports = runFirstExistingScript;
