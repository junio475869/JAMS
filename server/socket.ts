
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { storage } from './storage';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', async (message) => {
      // Store message in database
      await storage.createChatMessage(message);
      
      // Broadcast to all clients
      io.emit('message', message);
    });

    socket.on('reaction', async (data) => {
      // Store reaction in database
      await storage.addMessageReaction(data.messageId, data.reaction, data.userId);
      
      // Broadcast to all clients
      io.emit('reaction', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}
