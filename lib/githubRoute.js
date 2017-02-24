'use strict';
const crypto = require('crypto');
const executeScripts = require('./executeScripts');
const reject = require('./reject');

const handleGithubRoute = (request, response, options) => {
  // confirm signature:
  const headerSig = request.headers['x-hub-signature'];
  const sig = `sha1=${crypto.createHmac('sha1', options.secret).update(JSON.stringify(request.payload)).digest('hex')}`;
  if (headerSig !== sig) {
    options.log(['github', 'secret'], 'Secret didnt match');
    return reject(request, response);
  }
  const payload = request.payload;
  const event = request.headers['x-github-event'];
  if (event === 'push' && payload.deleted) {
    //if push and deleted, do nothing
    return response.end('skipped');
  }
  const dataToProcess = {
    event,
    user: payload.repository ? payload.repository.owner.login : null,
    repo: payload.repository ? payload.repository.name : null,
    branch: payload.ref ? payload.ref.replace('refs/heads/', '') : null
  };
  executeScripts(dataToProcess, options, (err, result) => {
    if (err) {
      response.end('failed');
    }
    response.end('success');
  });
};
module.exports = handleGithubRoute;
