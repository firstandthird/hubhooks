'use strict';
const crypto = require('crypto');
const executeScripts = require('./executeScripts');
const reject = require('./reject');

const handleGithubRoute = (request, response, options) => {
  // confirm signature:
  const headerSig = request.headers['x-hub-signature'];
  const sig = `sha1=${crypto.createHmac('sha1', options.secret).update(JSON.stringify(request.payload)).digest('hex')}`;
  if (headerSig !== sig) {
    return reject(request, response);
  }
  const payload = request.payload;
  const dataToProcess = {
    event: request.headers['x-github-event'],
    user: payload.repository.owner.login,
    repo: payload.repository.name,
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
