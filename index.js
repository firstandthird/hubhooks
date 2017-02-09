'use strict';
const http = require('http');
const Logr = require('logr');
const handleSimpleRoute = require('./lib/simpleRoute');
const handleGithubRoute = require('./lib/githubRoute');
const reject = require('./lib/reject');

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
      return reject(request, response);
    }
    request.on('data', (data) => {
      payloadAsString += data;
    });
    const end = () => {
      request.payload = JSON.parse(payloadAsString);
      if (request.url === this.options.githubRoute) {
        return handleGithubRoute(request, response, this.options);
      }
      if (request.url === this.options.simpleRoute) {
        return handleSimpleRoute(request, response, this.options);
      }
      return reject(request, response);
    };
    request.on('end', end.bind(this));
  }
}

module.exports = Server;
