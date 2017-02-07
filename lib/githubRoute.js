'use strict';
const crypto = require('crypto');
const executeScripts = require('./executeScripts');

const handleGithubRoute = (request, response, options) => {
  // confirm signature:
  const headerSig = request.headers['x-hub-signature'];
  const sig = `sha1=${crypto.createHmac('sha1', options.secret).update(JSON.stringify(request.payload)).digest('hex')}`;
  if (headerSig !== sig) {
    response.writeHead(403, { 'Content-Type': 'text/plain' });
    response.end('Permission Denied');
    return request.connection.destroy();
  }
  const dataToProcess = {
    event: request.headers['x-github-event'],
    repo: request.payload.repository.full_name
  };
  dataToProcess.branch = request.payload.ref || 'master';
  executeScripts(dataToProcess, options, (err, result) => {
    if (err) {
      response.end('failed');
    }
    response.end('success');
  });
};
module.exports = handleGithubRoute;
