import { Router } from 'express';
import { GmailConnection, gmailService } from '../services/gmail';
import { storage } from '../storage';

const router = Router();

router.get("/events", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const connections = await storage.getGmailConnections(req.user!.id);
    if (!connections || connections.length === 0) {
      return res.status(404).json({ error: "No Google account connected" });
    }
    const events = await Promise.all(
      connections.map(async (connection) => {
        const events = await gmailService.getCalendarEvents(connection as GmailConnection);
        return events;
      })
    );
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

router.post("/events", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const connections = await storage.getGmailConnections(req.user!.id);
    if (!connections || connections.length === 0) {
      return res.status(404).json({ error: "No Google account connected" });
    }

    const event = await gmailService.createCalendarEvent(
      connections[0] as GmailConnection,
      req.body
    );
    res.json(event);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});


export default router; 