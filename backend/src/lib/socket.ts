import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { logger } from './logger';

let io: Server;

export const initSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production security
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-room', (eventId: string) => {
      socket.join(`event:${eventId}`);
      logger.info(`Socket ${socket.id} joined event room: ${eventId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

export const emitToEventRoom = (eventId: string, eventName: string, data: any) => {
  if (io) {
    io.to(`event:${eventId}`).emit(eventName, data);
  }
};
