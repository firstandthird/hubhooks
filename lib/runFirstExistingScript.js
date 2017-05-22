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
    options.log(['hubhooks', 'run'], `running ${existingScript}`);
    const env = {
      GITHUB_REF_TYPE: data.ref_type,
      GITHUB_EVENT: data.event,
      GITHUB_REPO: data.repo,
      GITHUB_BRANCH: data.branch,
      GITHUB_TAGS: data.tag,
      GITHUB_USER: data.user,
    };
    if (data.tag) {
      env.GITHUB_TAG = data.tag;
    }
    runshell(existingScript, {
      log: (options.verbose),
      env
    }, (scriptErr, stdio, stderr) => {
      if (scriptErr) {
        return callback(scriptErr);
      }
      callback(null, existingScript);
    });
  });
};

module.exports = runFirstExistingScript;
