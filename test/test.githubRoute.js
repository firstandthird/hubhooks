'use strict';
const test = require('tape');
const wreck = require('wreck');
const path = require('path');
const setup = require('./setup.js');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
// will generate the sha1 signature for each test payload:
const getSig = payloadToSend => `sha1=${crypto.createHmac('sha1', '123').update(JSON.stringify(payloadToSend)).digest('hex')}`;

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
        name: 'Hello-World',
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
        'x-hub-signature': getSig(payloadToSend)
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
    server.settings.app.verbose = true;
    const payloadToSend = {
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347
      },
      repository: {
        id: 1296269,
        name: 'Hello-World',
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
    server.on('tail', () => {
      fs.readFile(process.env.HUBHOOKS_TEST, (err, data) => {
        const allScriptResults = data.toString().split(os.EOL);
        t.equal(allScriptResults[0], 'arrested development season 4');
        t.equal(allScriptResults[1], 'house of cards');
        t.equal(allScriptResults[2], 'the get down');
        server.stop(t.end);
      })
    });
    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'create',
        'x-hub-signature': getSig(payloadToSend)
      },
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 200);
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
        name: 'Goodbye-World',
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
    server.on('tail', () => {
      fs.readFile(process.env.HUBHOOKS_TEST, (err, data) => {
        const allScriptResults = data.toString().split(os.EOL);
        t.equal(allScriptResults[0], 'luke cage');
        t.equal(allScriptResults[1], 'house of cards');
        server.stop(t.end);
      })
    });

    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'push',
        'x-hub-signature': getSig(payloadToSend)
      },
      payload: payloadToSend
    }, (err, res, payload) => {
      t.equal(err, null);
      t.equal(res.statusCode, 200);
    });
  });
});

test('githubRoute sets REF_TYPE if passed', (t) => {
  setup({}, (err, server) => {
    server.settings.app.secret = '123';
    server.settings.app.scripts = path.join(__dirname, 'scripts');
    const payloadToSend = {
      ref_type: 'hello',
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347
      },
      repository: {
        id: 1296269,
        name: 'Hello-Kitty',
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

    server.on('tail', () => {
      fs.readFile(process.env.HUBHOOKS_TEST, (err, data) => {
        const allScriptResults = data.toString().split(os.EOL);
        t.equal(allScriptResults[1], 'hello', 'sub-process received the value of process.env.REF_TYPE');
        server.stop(t.end);
      })
    });
    wreck.post('http://localhost:8080', {
      headers: {
        'x-github-event': 'create',
        'x-hub-signature': getSig(payloadToSend)
      },
      payload: payloadToSend
    }, () => {});
  });
});
