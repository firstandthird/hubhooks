'use strict';
const Joi = require('joi');

const SimpleSchema = Joi.object().keys({
  secret: Joi.string().required(),
  type: Joi.string().required(),
  repo: Joi.string().required(),
  branch: Joi.string().required(),
  user: Joi.string().required(),
});

module.exports = (request, response, options) => {
  SimpleSchema.validate(request.payload, (err, result) => {
    if (err || result.length !== 4) {
      if (result.secret === options.secret) {
        return this.handleGithubRoute(request.payload, response);
      }
      response.writeHead(403, { 'Content-Type': 'text/plain' });
      response.end('Permission Denied');
      return request.connection.destroy();
    }
  });
};
