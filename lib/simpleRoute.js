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
      response.writeHead(500, { 'Content-Type': 'text/json' });
      response.end('Server Error');
      return request.connection.destroy();
    }
    console.log('****')
    console.log(result)
    if (result.length === 5) {
      if (result.secret === options.secret) {
        return executeScripts(result, options, (executeErr, executeResults) => {
          if (executeErr) {
            response.end('failed');
          }
          response.end('success');
        });
      }
    }
    return reject(request, response);
  });
};
