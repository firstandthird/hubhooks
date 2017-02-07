'use strict';
const test = require('tape');
const Server = require('../index.js');
const executeScripts = require('../lib/executeScripts');
const runFirstExistingScript = require('../lib/runFirstExistingScript');
const path = require('path');

// you can use this snippet to print an sha1 strings for any other packages you want to add for testing:
// const crypto = require('crypto');
// console.log(crypto.createHmac('sha1', '123').update(JSON.stringify(payloadToSend)).digest('hex'));
test('can construct server', (t) => {
  const server = new Server({ secret: '123' });
  t.equal(typeof server.start, 'function');
  t.equal(server instanceof Server, true);
  t.end();
});

// test('executeScripts', (t) => {
//   executeScripts({
//     event: 'create',
//     repo: 'octocat/Hello-World',
//     branch: 'master'
//   },
//     {
//       scripts: path.join(__dirname, 'test', 'scripts')
//     }, (err, result) => {
//       t.equal(err, null);
//       console.log('++++');
//       console.log('++++');
//       console.log('++++');
//       console.log('++++');
//       console.log(result);
//   });
// });

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

test('runFirstExistingScript error fallback', (t) => {
  runFirstExistingScript([
    path.join(__dirname, 'scripts', 'booga', 'no', 'notAThing'),
    path.join(__dirname, 'scripts', 'also', 'not', 'real'),
  ], {
    event: 'create'
  }, {
    scripts: __dirname
  }, (err, results) => {
    t.notOk(err);
    t.equal(results, path.join(__dirname, 'scripts', 'create', 'error'));
    t.end();
  });
});
