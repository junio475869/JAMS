import { Router } from 'express';
import { gmailService } from '../gmail-service';
import { storage } from '../storage';
import { authenticate } from '../auth';

const router = Router();

// Get auth URL for Gmail connection
router.post('/auth-url', authenticate, (req, res) => {
  const url = gmailService.getAuthUrl();
  res.json({ url });
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const userId = req.user?.id;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    await gmailService.handleCallback(code as string, userId);
    res.redirect('/profile?gmail=connected');
  } catch (error) {
    console.error('Error handling Gmail callback:', error);
    res.redirect('/profile?gmail=error');
  }
});

// Get user's Gmail connections
router.get('/connections', authenticate, async (req, res) => {
  try {
    console.log("req.user", req.user);
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const connections = await storage.getGmailConnections(req.user!.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching Gmail connections:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail connections' });
  }
});

// Disconnect Gmail account
router.delete('/connections/:email', authenticate, async (req, res) => {
  const { email } = req.params;
  const userId = req.user!.id;

  try {
    await storage.deleteGmailConnection(userId, email);
    res.json({ message: 'Gmail account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Gmail account:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail account' });
  }
});

export default router; 