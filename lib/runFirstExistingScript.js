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
    if (options.verbose) {
      options.log(['hubhooks', 'notice'], `running ${existingScript}`);
    }
    console.log('running %s', existingScript);
    // todo: does this pass any params to the script?
    runshell(existingScript, {
      env: {
        REPO: data.repo,
        BRANCH: data.branch,
        USER: data.user
      },
      // args: JSON.stringify(data)
    }, (scriptErr, stdio, stderr) => {
      console.log('outcome was:')
      console.log(scriptErr)
      console.log(stdio)
      console.log(stderr)
      if (scriptErr) {
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
