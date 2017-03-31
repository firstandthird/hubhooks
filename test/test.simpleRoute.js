'use strict';
const test = require('tape');
const setup = require('./setup.js');
const wreck = require('wreck');
const path = require('path');
const fs = require('fs');
const os = require('os');

test('simpleRoute will send a hook', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      secret: '123',
      event: 'create',
      repo: 'octocat/Goodbye-World',
      branch: 'notMaster',
      user: 'octocat'
    };
    server.on('tail', () => {
      fs.readFile(process.env.HUBHOOKS_TEST, (err, data) => {
        const allScriptResults = data.toString().split(os.EOL);
        console.log(allScriptResults);
        t.equal(allScriptResults[0], 'the get down');
        t.equal(allScriptResults[1], 'bloodline');
        t.equal(allScriptResults[2], 'house of cards');
        server.stop(t.end);
      })
    });
    wreck.post('http://localhost:8080/simple', {
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 200);
    });
  });
});

test('simpleRoute will bounce if not valid', (t) => {
  setup({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true }, (err, server) => {
    const payloadToSend = {
      event: 'create',
      branch: 'notMaster',
    };
    wreck.post('http://localhost:8080/simple', {
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 400);
      server.stop(() => {
        t.end();
      });
    });
  });
});

test('simpleRoute will bounce if secret not correct', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      event: 'create',
      secret: 'no good',
      user: 'octocat',
      repo: 'octocat/Goodbye-World',
      branch: 'notMaster',
    };
    wreck.post('http://localhost:8080/simple', {
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 401);
      server.stop(() => {
        t.end();
      });
    });
  });
});
