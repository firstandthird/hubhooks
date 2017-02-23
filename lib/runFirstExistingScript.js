'use strict';
const async = require('async');
const fs = require('fs');
const runshell = require('runshell');

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
    options.log(['run'], `running ${existingScript}`);
    runshell(existingScript, {
      env: {
        GITHUB_EVENT: data.event,
        GITHUB_REPO: data.repo,
        GITHUB_BRANCH: data.branch,
        GITHUB_USER: data.user
      },
    }, (scriptErr, stdio, stderr) => {
      if (scriptErr) {
        return callback(scriptErr);
      }
      if (options.verbose) {
        options.log(['run', existingScript], stdio);
      }
      callback(null, existingScript);
    });
  });
};

module.exports = runFirstExistingScript;
