'use strict';
const test = require('tape');
const Server = require('../index.js');
const executeScripts = require('../lib/executeScripts');
const runFirstExistingScript = require('../lib/runFirstExistingScript');
const path = require('path');

test('can construct server', (t) => {
  const server = new Server({ secret: '123' });
  t.equal(typeof server.start, 'function');
  t.equal(server instanceof Server, true);
  t.end();
});

test('executeScripts', (t) => {
  executeScripts({
    event: 'create',
    repo: 'octocat/Hello-World',
    branch: 'master'
  },
    {
      scripts: path.join(__dirname, 'scripts')
    }, (err, results) => {
      t.equal(err, null);
      t.equal(results.afterHooks, path.join(__dirname, 'scripts', 'hooks', 'after'));
      t.equal(results.beforeHooks, path.join(__dirname, 'scripts', 'hooks', 'create', 'before'));
      t.equal(results.processResponse, path.join(__dirname, 'scripts', 'create', 'octocat/Hello-World'));
      t.end();
    });
});
/*
test('runFirstExistingScript', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'booga', 'no', 'notAThing'),
    path.join(__dirname, 'scripts', 'create', 'octocat/Hello-World'),
    path.join(__dirname, 'scripts', 'create', 'default'),
  ], {
    event: 'create'
  }, {
    scripts: __dirname
  }, (err, results) => {
    t.notOk(err);
    t.equal(results, path.join(__dirname, 'scripts', 'create', 'octocat/Hello-World'));
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
    scripts: path.join(__dirname, 'scripts')
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
    scripts: path.join(__dirname, 'scripts')
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
    scripts: path.join(__dirname, 'scripts')
  }, (err, results) => {
    t.notOk(err);
    t.equal(results, path.join(__dirname, 'scripts', 'hooks', 'alter', 'error'));
    t.end();
  });
});
*/
