'use strict';
module.exports = (request, response) => {
  response.writeHead(403, { 'Content-Type': 'text/plain' });
  response.end('Permission Denied');
  return request.connection.destroy();
};
