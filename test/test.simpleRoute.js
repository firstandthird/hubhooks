'use strict';
const test = require('tape');
const Server = require('../index.js');
const wreck = require('wreck');
const path = require('path');

test('simpleRoute will send a hook', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
  const payloadToSend = {
    secret: '123',
    event: 'opened',
    repo: 'octocat/Goodbye-World',
    branch: 'notMaster',
    user: 'octocat'
  };
  const oldLog = console.log;
  const allScriptResults = [];
  console.log = (data) => {
    allScriptResults.push(data);
  };
  wreck.post('http://localhost:8080/simple', {
    payload: payloadToSend
  }, (err, res, payload) => {
    console.log = oldLog;
    t.equal(err, null);
    t.equal(res.statusCode, 200);
    t.equal(allScriptResults.length, 2);
    console.log('======================')
    console.log(allScriptResults)
    t.equal(allScriptResults[0].indexOf('after') > -1, true);
    server.stop(t.end);
  });
});

test('simpleRoute will bounce if not valid', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
  const payloadToSend = {
    event: 'opened',
    branch: 'notMaster',
  };
  wreck.post('http://localhost:8080/simple', {
    payload: payloadToSend
  }, (err, res, payload) => {
    t.equal(err, null);
    t.equal(res.statusCode, 403);
    server.stop(() => {
      t.end();
    });
  });
});

test('simpleRoute will bounce if secret not correct', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
  const payloadToSend = {
    event: 'opened',
    secret: 'no good',
    user: 'octocat',
    repo: 'octocat/Goodbye-World',
    branch: 'notMaster',
  };
  wreck.post('http://localhost:8080/simple', {
    payload: payloadToSend
  }, (err, res, payload) => {
    t.equal(err, null);
    t.equal(res.statusCode, 403);
    server.stop(() => {
      t.end();
    });
  });
});
