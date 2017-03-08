'use strict';
const Joi = require('joi');
const boom = require('boom');
const executeScripts = require('../lib/executeScripts');

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
    console.log('asdfasdfasdf')
    const settings = request.server.settings.app;
    if (request.payload.secret === settings.secret) {
      if (settings.verbose) {
        request.server.log(['simple', 'incoming'], request.payload);
      }
      console.log('handler')
      console.log('handler')
      executeScripts(request.payload, {}, (executeErr, executeResults) => {
        console.log('-----00000000000000000')
        console.log(executeErr)
        if (executeErr) {
          return reply('failed');
        }
        return reply('success');
      });
      request.server.log(['simple', 'secret'], 'Secret didnt match');
      return reply(boom.unauthorized('Permission Denied'));
    }
  }
};
