'use strict';
const test = require('tape');
const runFirstExistingScript = require('../lib/runFirstExistingScript');
const path = require('path');
const setup = require('./setup.js');

test('executeScripts', (t) => {
  setup({}, (err, server) => {
    server.methods.executeScripts({
      event: 'create',
      repo: 'Hello-World',
      branch: 'master'
    },
      {
        scripts: path.join(__dirname, 'scripts'),
        log: () => {}
      }, (err, results) => {
        t.equal(err, null);
        t.equal(results.afterHooks, path.join(__dirname, 'scripts', 'hooks', 'after'));
        t.equal(results.beforeHooks, path.join(__dirname, 'scripts', 'hooks', 'create', 'before'));
        t.equal(results.processResponse, path.join(__dirname, 'scripts', 'create', 'Hello-World'));
        t.end();
      });
  });
});

test('runFirstExistingScript', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'booga', 'no', 'notAThing'),
    path.join(__dirname, 'scripts', 'create', 'Hello-World'),
    path.join(__dirname, 'scripts', 'create', 'default'),
  ], {
    event: 'create'
  }, {
    scripts: __dirname,
    log: () => {}
  }, (err, results) => {
    t.notOk(err);
    t.equal(results, path.join(__dirname, 'scripts', 'create', 'Hello-World'));
    t.end();
  });
});

test('runFirstExistingScript fallback if none executed', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'booga', 'no', 'notAThing'),
    path.join(__dirname, 'scripts', 'also', 'not', 'real'),
  ], {
    event: 'create'
  }, {
    scripts: path.join(__dirname, 'scripts'),
    log: () => {}
  }, (err, results) => {
    t.notOk(err);
    t.equal(results, undefined);
    t.end();
  });
});

test('runFirstExistingScript fallback if none executed', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'booga', 'no', 'notAThing'),
    path.join(__dirname, 'scripts', 'also', 'not', 'real'),
  ], {
    event: 'create'
  }, {
    scripts: path.join(__dirname, 'scripts'),
    log: () => {}
  }, (err, results) => {
    t.notOk(err);
    t.end();
  });
});

test('runFirstExistingScript error fallback', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'alter', 'testRepo')
  ], {
    event: 'alter'
  }, {
    scripts: path.join(__dirname, 'scripts'),
    log: () => {}
  }, (err, results) => {
    t.ok(err);
    t.equal(err.toString().indexOf('alter') > -1, true);
    t.end();
  });
});
