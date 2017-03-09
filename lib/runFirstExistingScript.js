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
      return callback();
    }
    options.log(['hubhooks', 'run'], `running ${existingScript}`);
    runshell(existingScript, {
      log: (options.verbose),
      env: {
        GITHUB_EVENT: data.event,
        GITHUB_REPO: data.repo,
        GITHUB_BRANCH: data.branch,
        GITHUB_USER: data.user
      },
    }, (scriptErr, stdio, stderr) => {

      // if it's a script error and not already the error hook, call the error hook:
      if (scriptErr && fileList.indexOf(path.join(options.scripts, 'hooks', 'error')) < 0) {
        return runFirstExistingScript([
          path.join(options.scripts, 'hooks', data.event, 'error'),
          path.join(options.scripts, 'hooks', 'error')
        ], scriptErr, options, callback);
      } else if (scriptErr) {
        return callback(scriptErr);
      }
      if (options.verbose) {
        options.log(['hubhooks', 'notice', existingScript], stdio);
      }

      callback(null, existingScript);
    });
  });
};

module.exports = runFirstExistingScript;
