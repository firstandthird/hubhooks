'use strict';
const Joi = require('joi');

const SimpleSchema = Joi.object().keys({
  type: Joi.string().required(),
  repo: Joi.string().required(),
  branch: Joi.string().required(),
  user: Joi.string().required(),
});

module.exports = (request, response) => {
  SimpleSchema.validate(request.payload, (err, result) => {
    if (err || result.length !== 4) {
      return this.handleGithubRoute(request.payload, response);
    }
  });
};
