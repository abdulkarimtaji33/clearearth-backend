/**
 * Socket.IO setup — real-time notifications
 * Usage: const { emitToTenant } = require('./socket');
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');

let io = null;

// userId -> Set<socketId>
const userSockets = {};

function normalizeUserId(userId) {
  return userId != null ? String(userId) : null;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      socket.userId = normalizeUserId(payload.userId || payload.id);
      socket.tenantId = payload.tenantId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = normalizeUserId(socket.userId);
    const { tenantId } = socket;
    if (userId) {
      socket.userId = userId;
      if (!userSockets[userId]) userSockets[userId] = new Set();
      userSockets[userId].add(socket.id);
      socket.join(`tenant:${tenantId}`);
    }

    socket.on('disconnect', () => {
      if (userId && userSockets[userId]) {
        userSockets[userId].delete(socket.id);
        if (userSockets[userId].size === 0) delete userSockets[userId];
      }
    });
  });

  return io;
}

function emitToUser(userId, event, data) {
  if (!io) return;
  const sids = userSockets[normalizeUserId(userId)];
  if (!sids) return;
  sids.forEach((sid) => io.to(sid).emit(event, data));
}

function emitToTenant(tenantId, event, data) {
  if (!io) return;
  io.to(`tenant:${tenantId}`).emit(event, data);
}

function emitToUsers(userIds, event, data) {
  if (!io) return;
  userIds.forEach((id) => emitToUser(id, event, data));
}

function getIo() {
  return io;
}

module.exports = { initSocket, emitToUser, emitToUsers, emitToTenant, getIo };
