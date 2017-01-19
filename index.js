'use strict';
const http = require('http');
const fs = require('fs');
const async = require('async');
const path = require('path');
const runshell = require('runshell');
const crypto = require('crypto');
const Logr = require('logr');
const log = new Logr({
  type: 'cli'
});

const defaultOptions = {
  verbose: false,
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
    this.server = http.createServer(this.receiveHttpRequest.bind(this));
    this.server.listen(this.options.port, 'localhost');
    if (this.options.verbose) {
      log(['hubhooks', 'notice'], `server listening at ${this.options.port}`);
    }
  }

  stop(callback) {
    this.server.close(callback);
  }

  receiveHttpRequest(request, response) {
    let payloadAsString = '';
    if (request.method !== 'POST') {
      response.writeHead(403, { 'Content-Type': 'text/plain' }).end();
      response.end('Permission Denied');
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
      return this.processGithubEvent(dataToProcess, response);
    };
    request.on('end', end.bind(this));
  }

  // might remove to its own lib for re-use:
  runFirstExistingScript(fileList, data, callback) {
    async.detect(fileList, (pathname, detectCallback) => {
      fs.exists(pathname, (pathExists) => detectCallback(null, pathExists));
    }, (err, existingScript) => {
      // if an error:
      if (err) {
        return callback(err);
      }
      // if none exist:
      if (!existingScript) {
        return callback();
      }
      if (this.options.verbose) {
        log(['hubhooks', 'notice'], `running ${existingScript}`);
      }
      // todo: does this pass any params to the script?
      runshell(existingScript, {
        env: process.env,
        // args: JSON.stringify(data)
      }, (scriptErr, stdio, stderr) => {
        // if it's not an error and not already the error hook, call the error hook:
        if (scriptErr && fileList.indexOf(path.join(this.options.scripts, 'hooks', 'error')) < 0) {
          return this.runFirstExistingScript([
            path.join(this.options.scripts, 'hooks', data.event, 'error'),
            path.join(this.options.scripts, 'hooks', 'error')
          ], scriptErr, callback);
        }
        if (this.options.verbose) {
          log(['hubhooks', 'notice', existingScript], stdio);
        }
        callback();
      });
    });
  }

  processGithubEvent(data, response) {
    async.autoInject({
      beforeHooks: done => this.runFirstExistingScript([
        path.join(this.options.scripts, 'hooks', data.event, 'before'),
        path.join(this.options.scripts, 'hooks', 'before')
      ], data, done),
      processResponse: (beforeHooks, done) => this.runFirstExistingScript([
        path.join(this.options.scripts, data.event, `${data.repo}-${data.branch}`),
        path.join(this.options.scripts, data.event, data.repo),
        path.join(this.options.scripts, data.event, 'default')
      ], data, done),
      afterHooks: (processResponse, done) => this.runFirstExistingScript([
        path.join(this.options.scripts, 'hooks', data.event, 'after'),
        path.join(this.options.scripts, 'hooks', 'after')
      ], data, done),
    }, (err, result) => {
      if (err) {
        response.end('failed');
      }
      response.end('success');
    });
  }
}

module.exports = Server;
