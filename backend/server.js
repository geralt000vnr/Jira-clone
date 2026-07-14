const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { port, mongoUri, clientUrl } = require('./src/config/env');
const app = require('./src/app');
const initSockets = require('./src/sockets');
const { attachIO } = require('./src/services/notificationService');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: clientUrl } });
initSockets(io);
attachIO(io);

mongoose
  .connect(mongoUri)
  .then(() => {
    server.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
