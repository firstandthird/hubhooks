const test = require('tape');
const Server = require('../index.js');
const wreck = require('wreck');
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

test('will bounce if signature key not given', (t) => {
  const server = new Server({ secret: 'garden' });
  server.start();
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
    t.equal(res.statusCode, 403);
    server.stop(() => {
      t.end();
    });
  });
});

test('can load server and send it http signals', (t) => {
  t.plan(3);
  const server = new Server({ secret: '123' });
  server.start();
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

test('will trigger before/end event hooks', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
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
  const oldLog = console.log;
  const allScriptResults = [];
  console.log = (data) => {
    allScriptResults.push(data);
  };
  wreck.post('http://localhost:8080', {
    headers: {
      'x-github-event': 'create',
      'x-hub-signature': 'sha1=e5c47527c20eccce2b0e8b5d8f0a2c8237595cc3'
    },
    payload: payloadToSend
  }, (err, res, payload) => {
    console.log = oldLog;
    t.equal(err, null);
    t.equal(res.statusCode, 200);
    server.stop(() => {
      t.equal(allScriptResults.length, 6);
      t.equal(allScriptResults[0].indexOf('create') > -1, true);
      t.equal(allScriptResults[0].indexOf('before') > -1, true);
      t.equal(allScriptResults[2].indexOf('octocat') > -1, true);
      t.equal(allScriptResults[2].indexOf('Hello-World') > -1, true);
      t.equal(allScriptResults[4].indexOf('hooks') > -1, true);
      t.equal(allScriptResults[4].indexOf('after') > -1, true);
      t.end();
    });
  });
});

test('will trigger event-specific hooks', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
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
  const oldLog = console.log;
  const allScriptResults = [];
  console.log = (data) => {
    allScriptResults.push(data);
  };
  wreck.post('http://localhost:8080', {
    headers: {
      'x-github-event': 'push',
      'x-hub-signature': 'sha1=2807ea9ca996abd3b063a76b3d088ec7b32e7d72'
    },
    payload: payloadToSend
  }, (err, res, payload) => {
    console.log = oldLog;
    t.equal(err, null);
    t.equal(res.statusCode, 200);
    server.stop(() => {
      t.equal(allScriptResults.length, 4);
      t.equal(allScriptResults[0].indexOf('default') > -1, true);
      t.equal(allScriptResults[2].indexOf('after') > -1, true);
      t.end();
    });
  });
});

test('will send a minimal hook when specified', (t) => {
  const server = new Server({ secret: '123', scripts: path.join(__dirname, 'scripts'), verbose: true });
  server.start();
  const payloadToSend = {
    type: 'opened',
    user: 'octocat',
    repo: 'octocat/Goodbye-World',
    branch: 'notMaster'
  };
  const oldLog = console.log;
  const allScriptResults = [];
  console.log = (data) => {
    allScriptResults.push(data);
  };
  wreck.post('http://localhost:8080', {
    headers: {
      'x-github-event': 'push',
      'x-hub-signature': 'sha1=6dab86246adbdd9d83efc919b87121ee58f30fab'
    },
    payload: payloadToSend
  }, (err, res, payload) => {
    console.log = oldLog;
    t.equal(err, null);
    t.equal(res.statusCode, 200);
    server.stop(() => {
      t.equal(allScriptResults.length, 2);
      t.equal(allScriptResults[0].indexOf('after') > -1, true);
      t.end();
    });
  });
});
