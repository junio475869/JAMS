
import { Router } from 'express';
import { storage } from './storage';

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  const user = await storage.getUser(req.user.id);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all channels
router.get('/channels', isAdmin, async (req, res) => {
  const channels = await storage.getAllChannels();
  res.json(channels);
});

// Create new channel
router.post('/channels', isAdmin, async (req, res) => {
  const channel = await storage.createChatChannel(req.body);
  res.json(channel);
});

// Delete channel
router.delete('/channels/:id', isAdmin, async (req, res) => {
  await storage.deleteChannel(parseInt(req.params.id));
  res.json({ success: true });
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  const users = await storage.getAllUsers();
  res.json(users);
});

// Update user role
router.put('/users/:id/role', isAdmin, async (req, res) => {
  const user = await storage.updateUser(parseInt(req.params.id), {
    role: req.body.role
  });
  res.json(user);
});

export default router;
