'use strict';
const async = require('async');
const Rapptor = require('rapptor');

module.exports = (options, callback) => {
  async.autoInject({
    rapptor(done) {
      const rapptor = new Rapptor();
      rapptor.start(done);
    },
    server(rapptor, done) {
      return done(null, rapptor[0]);
    },
  }, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result.server);
  });
};
