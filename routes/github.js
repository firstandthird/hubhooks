'use strict';
const crypto = require('crypto');
const boom = require('boom');

exports.github = {
  method: 'POST',
  path: '/',
  handler: (request, reply) => {
    const settings = request.server.settings.app;
    const headerSig = request.headers['x-hub-signature'];
    const event = request.headers['x-github-event'];
    const payload = request.payload;
    const sig = `sha1=${crypto.createHmac('sha1', settings.secret).update(JSON.stringify(payload)).digest('hex')}`;
    // confirm signature:
    if (headerSig !== sig) {
      request.server.log(['github', 'secret'], 'Secret didnt match');
      return reply(boom.unauthorized('Permission Denied'));
    }
    if (event === 'push' && payload.deleted) {
      //if push and deleted, do nothing
      return reply('skipped');
    }
    if (payload.ref_type) {
      process.env.REF_TYPE = payload.ref_type;
    }
    const dataToProcess = {
      event,
      user: payload.repository ? payload.repository.owner.login : null,
      repo: payload.repository ? payload.repository.full_name : null,
      branch: payload.ref ? payload.ref.replace('refs/heads/', '') : null
    };
    settings.log = (tags, data) => request.server.log(tags, data);
    reply('success');
    request.server.methods.executeScripts(dataToProcess, settings, () => {
      request.server.log(['finished'], dataToProcess);
    });
  }
};
