
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
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e7 // 10MB max file size
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('join_channel', (channelId) => {
      socket.join(channelId);
      console.log(`User joined channel: ${channelId}`);
    });

    socket.on('message', async (message) => {
      // Store message in database
      const savedMessage = await storage.createChatMessage(message);
      
      // Broadcast to channel
      io.to(message.channelId).emit('message', savedMessage);
    });

    socket.on('file_upload', async (data) => {
      const { file, channelId, userId, fileName } = data;
      
      // Store file in object storage and get URL
      const fileUrl = await storage.uploadFile(file, fileName);
      
      const message = {
        channelId,
        userId,
        type: 'file',
        content: fileName,
        attachmentUrl: fileUrl,
        timestamp: new Date().toISOString()
      };

      const savedMessage = await storage.createChatMessage(message);
      io.to(channelId).emit('message', savedMessage);
    });

    socket.on('reaction', async (data) => {
      // Store reaction in database
      await storage.addMessageReaction(data.messageId, data.reaction, data.userId);
      
      // Broadcast to channel
      io.to(data.channelId).emit('reaction', data);
    });

    socket.on('typing', (data) => {
      socket.to(data.channelId).emit('typing', {
        userId: data.userId,
        username: data.username,
        isTyping: data.isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}
