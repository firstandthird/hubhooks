'use strict';
const async = require('async');
const Rapptor = require('rapptor');
const fs = require('fs');
const path = require('path');
const os = require('os');
module.exports = (options, callback) => {
  const file = path.join(os.tmpdir(), 'hubhooks.txt');
  process.env.HUBHOOKS_TEST = file;
  console.log(file);
  async.autoInject({
    rapptor(done) {
      const rapptor = new Rapptor(options);
      rapptor.start(done);
    },
    cleanup(done) {
      fs.unlink(file, done);
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
