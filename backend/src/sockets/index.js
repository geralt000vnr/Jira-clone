const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function initSockets(io) {
  // authenticate socket connections using the same JWT as the REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, jwtSecret);
      socket.user = { id: payload.sub, organizationId: payload.orgId };
      next();
    } catch (err) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    // clients join a room per project board they have open
    socket.on('board:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('board:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

module.exports = initSockets;
