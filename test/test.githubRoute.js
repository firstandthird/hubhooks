'use strict';
const test = require('tape');
const wreck = require('wreck');
const path = require('path');
const setup = require('./setup.js');
// you can use this snippet to print an sha1 strings for any other packages you want to add for testing:
// const crypto = require('crypto');
// console.log(crypto.createHmac('sha1', '123').update(JSON.stringify(payloadToSend)).digest('hex'));

test('githubRoute: will bounce if signature key not given', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    wreck.post('http://localhost:8080', {
      headers: {
        'x-hub-signature': '123'
      },
      payload: {
        repository: {
          name: 'not a thing'
        }
      }
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 401);
      server.stop(() => {
        t.end();
      });
    });
  });
});

test('githubRoute accepts http signals', (t) => {
  t.plan(3);
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347
      },
      repository: {
        id: 1296269,
        full_name: 'octocat/Hello-World',
        owner: {
          login: 'octocat',
          id: 1
        },
      },
      sender: {
        login: 'octocat',
        id: 1,
      }
    };
    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'create',
        'x-hub-signature': 'sha1=e5c47527c20eccce2b0e8b5d8f0a2c8237595cc3'
      },
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 200);
      server.stop(() => {
        const payloadString = payload.toString();
        t.equal(payloadString, 'success');
      });
    });
  });
});

test('githubRoute will trigger before/end event hooks', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347
      },
      repository: {
        id: 1296269,
        full_name: 'octocat/Hello-World',
        owner: {
          login: 'octocat',
          id: 1
        },
      },
      sender: {
        login: 'octocat',
        id: 1,
      }
    };
    const oldLog = server.log;
    const allScriptResults = [];
    server.log = (tags, data) => {
      allScriptResults.push(data);
    };
    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'create',
        'x-hub-signature': 'sha1=e5c47527c20eccce2b0e8b5d8f0a2c8237595cc3'
      },
      payload: payloadToSend
    }, (err, res, payload) => {
      server.log = oldLog;
      t.equal(err, null);
      t.equal(res.statusCode, 200);
      server.stop(() => {
        console.log('=========')
        console.log('=========')
        console.log('=========')
        console.log(allScriptResults)
        t.equal(allScriptResults[0].indexOf('create') > -1, true);
        t.equal(allScriptResults[0].indexOf('before') > -1, true);
        t.equal(allScriptResults[allScriptResults.length === 5 ? 2 : 1].indexOf('octocat') > -1, true);
        t.equal(allScriptResults[allScriptResults.length - 1].indexOf('hooks') > -1, true);
        t.equal(allScriptResults[allScriptResults.length - 1].indexOf('after') > -1, true);
        t.end();
      });
    });
  });
});

test('githubRoute will trigger event-specific hooks', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347
      },
      repository: {
        id: 1296269,
        full_name: 'octocat/Goodbye-World',
        owner: {
          login: 'octocat',
          id: 1
        },
      },
      sender: {
        login: 'octocat',
        id: 1,
      }
    };
    const oldLog = server.log;
    const allScriptResults = [];
    server.log = (tags, data) => {
      allScriptResults.push(data);
    };
    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'push',
        'x-hub-signature': 'sha1=2807ea9ca996abd3b063a76b3d088ec7b32e7d72'
      },
      payload: payloadToSend
    }, (err, res, payload) => {
      server.log = oldLog;
      t.equal(err, null);
      t.equal(res.statusCode, 200);
      server.stop(() => {
        t.equal(allScriptResults[0].indexOf('default') > -1, true);
        t.equal(allScriptResults[allScriptResults.length - 1].indexOf('after') > -1, true);
        t.end();
      });
    });
  });
});
