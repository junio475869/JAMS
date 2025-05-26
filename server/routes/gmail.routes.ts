import { Router } from 'express';
import { GmailConnection, gmailService } from '../services/gmail';
import { storage } from '../storage';

const router = Router();

// Get auth URL for Gmail connection
router.post('/auth-url', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

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
router.get('/connections', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const connections = await storage.getGmailConnections(req.user.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching Gmail connections:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail connections' });
  }
});

// Disconnect Gmail account
router.delete('/connections/:email', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
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

router.get("/inbox", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const connections = await storage.getGmailConnections(req.user!.id);
    if (!connections || connections.length === 0) {
      return res.status(404).json({ error: "No Gmail accounts connected" });
    }

    // Get emails from filtered accounts
    const allEmails = await Promise.all(
      connections.map(async (connection) => {
        const emails = await gmailService.getEmails(connection as GmailConnection);
        return emails;
      })
    );

    // Flatten and deduplicate emails based on Message-ID
    const emailMap = new Map();
    allEmails.flat().forEach(email => {
      const key = email.id;
      if (!emailMap.has(key)) {
        emailMap.set(key, email);
      } else {
        // If we have a duplicate, keep the one with the most recent date
        const existingEmail = emailMap.get(key);
        if (new Date(email.date) > new Date(existingEmail.date)) {
          emailMap.set(key, email);
        }
      }
    });

    // Convert back to array and sort by date
    const emails = Array.from(emailMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return both emails and available Gmail accounts
    res.json({
      emails,
      availableAccounts: connections.map(conn => ({
        email: conn.email,
        isSelected: true
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router; 