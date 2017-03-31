'use strict';
const Joi = require('joi');
const boom = require('boom');

exports.simple = {
  method: 'POST',
  path: '/simple',
  config: {
    validate: {
      payload: {
        secret: Joi.string().required(),
        event: Joi.string().required(),
        repo: Joi.string().required(),
        branch: Joi.string().required(),
        user: Joi.string().required()
      }
    }
  },
  handler(request, reply) {
    const settings = request.server.settings.app;
    if (settings.verbose) {
      request.server.log(['simple', 'incoming'], request.payload);
    }
    if (request.payload.secret !== settings.secret) {
      request.server.log(['simple', 'secret'], 'Secret didnt match');
      return reply(boom.unauthorized('Permission Denied'));
    }
    settings.log = (tags, data) => request.server.log(tags, data);
    // go ahead and reply to github before the script runs
    reply('success');
    const tail = request.tail('execute process');
    return request.server.methods.executeScripts(request.payload, settings, (executeErr, executeResults) => {
      if (executeErr) {
        request.server.log(executeErr);
      }
      if (settings.verbose) {
        request.server.log(['simple', 'results'], executeResults);
      }
      tail();
    });
  }
};
