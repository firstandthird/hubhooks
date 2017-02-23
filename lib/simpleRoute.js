'use strict';
const Joi = require('joi');
const executeScripts = require('./executeScripts');
const reject = require('./reject');
const SimpleSchema = Joi.object().keys({
  secret: Joi.string().required(),
  event: Joi.string().required(),
  repo: Joi.string().required(),
  branch: Joi.string().required(),
  user: Joi.string().required(),
});

module.exports = (request, response, options) => {
  SimpleSchema.validate(request.payload, (err, result) => {
    if (err) {
      return reject(request, response);
    }
    if (result.secret === options.secret) {
      if (options.verbose) {
        options.log(['simple', 'incoming'], result);
      }
      return executeScripts(result, options, (executeErr, executeResults) => {
        if (executeErr) {
          response.end('failed');
        }
        response.end('success');
      });
    }
    options.log(['simple', 'secret'], 'Secret didnt match');
    return reject(request, response);
  });
};
