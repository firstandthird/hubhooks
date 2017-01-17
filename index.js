'use strict';
const http = require('http');
const fs = require('fs');
const async = require('async');
const path = require('path');
const runscript = require('runscript');
const crypto = require('crypto');

const defaultOptions = {
  port: 8080,
  secret: '',
  pusherName: process.env.HOSTNAME,
  scripts: process.cwd()
};

class Server {
  constructor(options) {
    this.options = {};
    Object.assign(this.options, defaultOptions, options);
    this.server = undefined;
  }

  start(callback) {
    this.server = http.createServer(this.receiveRequest.bind(this));
    this.server.listen(this.options.port, 'localhost');
  }

  stop(callback) {
    this.server.close(callback);
  }

  runScriptIfExists(pathname, data, callback) {
    console.log('you want to run %s', pathname)
    fs.exists(pathname, (pathExists) => {
      runscript(pathname, {})
      .catch(err => {
        // this.runScriptIfExists();
      });
      if (pathExists) {
        return callback(null, pathname);
      }
      return callback();
    });
  }

  receiveRequest(request, response, done) {
    let payloadAsString = '';
    if (request.method !== 'POST') {
      response.writeHead(403, { 'Content-Type': 'text/plain' }).end();
      return request.connection.destroy();
    }
    request.on('data', (data) => {
      payloadAsString += data;
    });
    const end = () => {
      request.payload = JSON.parse(payloadAsString);
      // confirm signature:
      const headerSig = request.headers['x-hub-signature'];
      const sig = `sha1=${crypto.createHmac('sha1', this.options.secret).update(payloadAsString).digest('hex')}`;
      if (headerSig !== sig) {
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('Permission Denied');
        return request.connection.destroy();
      }
      const dataToProcess = {
        event: request.headers['x-github-event'],
        repo: request.payload.repository.full_name
      };
      dataToProcess.branch = request.payload.ref || 'master';
      return this.processEvent(dataToProcess, response, done);
    };
    request.on('end', end.bind(this));
  }

  processEvent(data, response, done) {
    async.autoInject({
      beforeHooks: done => this.runScriptIfExists(path.join(this.options.scripts, 'hooks', 'before'), data, done),
      beforeEventHooks: done => this.runScriptIfExists(path.join(this.options.scripts, 'hooks', data.event, 'before'), data, done),
      processResponse: (beforeHooks, done) => async.detect([path.join(this.options.scripts, data.event, `${data.repo}-${data.branch}`), path.join(this.options.scripts, data.event, data.repo), path.join(this.options.scripts, data.event, data.branch)], (pathname, detectCallback) => {
        this.runScriptIfExists(pathname, data, detectCallback);
      }, done),
      afterHooks: (processResponse, done) => this.runScriptIfExists(path.join(this.options.scripts, 'hooks', 'after'), data, done),
      afterEventHooks: (processResponse, done) => this.runScriptIfExists(path.join(this.options.scripts, 'hooks', data.event, 'after'), data, done),
    }, (err, result) => {
      if (err) {
        return response.end('failed');
      }
      response.end('success');
    });
  }
}

module.exports = Server;
