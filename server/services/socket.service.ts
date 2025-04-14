
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { storage } from './storage';

export function setupWebSocket(httpServer: HTTPServer) {
  // Add channel and user types
  type Channel = {
    id: string;
    name: string;
    type: string;
    createdBy: string;
    isPrivate: boolean;
  };

  type User = {
    id: string;
    name: string;
    status: string;
    avatar?: string;
  };

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

    socket.on('join_channel', async (data) => {
      const { channelId, userId } = data;
      socket.join(channelId);
      
      // Add user to channel members if not already present
      await storage.addChannelMember({
        channelId,
        userId,
        role: 'member'
      });
      
      // Get channel history
      const messages = await storage.getChatMessagesByChannelId(channelId);
      socket.emit('channel_history', messages);
      
      console.log(`User ${userId} joined channel: ${channelId}`);
    });

    socket.on('create_channel', async (data) => {
      const { name, type, createdBy, isPrivate } = data;
      const channel = await storage.createChatChannel({
        name,
        type,
        createdBy,
        isPrivate
      });
      io.emit('channel_created', channel);
    });

    socket.on('create_dm', async (data) => {
      const { users } = data;
      const channel = await storage.createDirectMessage(users);
      users.forEach(userId => {
        socket.to(userId).emit('dm_created', channel);
      });
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

    // Channel management
    socket.on('fetch_channels', async () => {
      try {
        const channels = await storage.getAllChannels();
        socket.emit('channels_list', channels);
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    });

    socket.on('fetch_users', async () => {
      try {
        const users = await storage.getAllUsers();
        socket.emit('users_list', users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    });

    socket.on('update_user_status', async (data) => {
      try {
        await storage.updateUserStatus(data.userId, data.status);
        io.emit('user_status_updated', data);
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}
