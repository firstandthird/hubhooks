'use strict';
const http = require('http');
const crypto = require('crypto');
const Logr = require('logr');
const executeScripts = require('./lib/executeScripts');
const handleSimpleRoute = require('./lib/simpleRoute');

const defaultOptions = {
  verbose: false,
  port: 8080,
  secret: '',
  pusherName: process.env.HOSTNAME,
  scripts: process.cwd(),
  githubRoute: '/',
  simpleRoute: '/simple',
  log: new Logr({
    type: 'cli'
  })
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
      this.options.log(['hubhooks', 'notice'], `server listening at ${this.options.port}`);
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
      if (request.url === this.options.githubRoute) {
        return this.handleGithubRoute(request, response, this.options);
      }
      return handleSimpleRoute(request, response, this.options);
    };
    request.on('end', end.bind(this));
  }

  handleGithubRoute(request, response) {
    // confirm signature:
    const headerSig = request.headers['x-hub-signature'];
    const sig = `sha1=${crypto.createHmac('sha1', this.options.secret).update(JSON.stringify(request.payload)).digest('hex')}`;
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
    executeScripts(dataToProcess, this.options, (err, result) => {
      if (err) {
        response.end('failed');
      }
      response.end('success');
    });
  }
}

module.exports = Server;
