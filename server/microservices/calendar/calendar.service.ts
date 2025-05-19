import { BaseMicroservice } from '../base.service';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { IncomingWebhook } from '@slack/webhook';
import { Queue } from 'bull';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
  source: 'google' | 'outlook' | 'apple';
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

export class CalendarService extends BaseMicroservice {
  private googleAuth: any;
  private outlookClient: Client;
  private slackWebhook: IncomingWebhook;
  private notificationQueue: Queue;

  constructor(app: any, io: any, redis: any) {
    super(app, io, redis);
    this.googleAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    this.outlookClient = Client.init({
      authProvider: (done) => {
        done(null, process.env.OUTLOOK_ACCESS_TOKEN);
      }
    });
    this.slackWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);
    this.notificationQueue = new Queue('calendar-notifications', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }

  async initialize(): Promise<void> {
    // Initialize WebSocket handlers
    this.io.on('connection', (socket) => {
      socket.on('sync_calendars', this.handleCalendarSync.bind(this));
      socket.on('get_availability', this.handleGetAvailability.bind(this));
      socket.on('share_availability', this.handleShareAvailability.bind(this));
    });

    // Initialize REST endpoints
    this.app.post('/api/calendar/events', this.handleCreateEvent.bind(this));
    this.app.get('/api/calendar/events', this.handleGetEvents.bind(this));
    this.app.post('/api/calendar/notifications', this.handleSetNotifications.bind(this));

    // Initialize notification queue processor
    this.notificationQueue.process(async (job) => {
      await this.sendNotification(job.data);
    });
  }

  async cleanup(): Promise<void> {
    await this.notificationQueue.close();
  }

  private async handleCalendarSync(socket: any, data: { userId: string, provider: 'google' | 'outlook' | 'apple' }) {
    const { userId, provider } = data;
    
    try {
      let events: CalendarEvent[] = [];
      
      switch (provider) {
        case 'google':
          events = await this.syncGoogleCalendar(userId);
          break;
        case 'outlook':
          events = await this.syncOutlookCalendar(userId);
          break;
        case 'apple':
          events = await this.syncAppleCalendar(userId);
          break;
      }

      // Store events in Redis for quick access
      await this.redis.set(
        `calendar:${userId}:${provider}`,
        await this.encryptData(events),
        'EX',
        3600 // 1 hour cache
      );

      socket.emit('calendar_synced', { provider, count: events.length });
    } catch (error) {
      console.error('Calendar sync error:', error);
      socket.emit('calendar_sync_error', { provider, error: error.message });
    }
  }

  private async handleGetAvailability(socket: any, data: { userId: string, duration: number, days: number }) {
    const { userId, duration, days } = data;
    
    try {
      const events = await this.getAllCalendarEvents(userId);
      const availability = this.calculateAvailability(events, duration, days);
      
      socket.emit('availability', availability);
    } catch (error) {
      console.error('Availability calculation error:', error);
      socket.emit('availability_error', { error: error.message });
    }
  }

  private async handleShareAvailability(socket: any, data: { userId: string, slots: AvailabilitySlot[], recipients: string[] }) {
    const { userId, slots, recipients } = data;
    
    try {
      // Generate availability message
      const message = this.formatAvailabilityMessage(slots);
      
      // Send to recipients
      for (const recipient of recipients) {
        await this.slackWebhook.send({
          text: `Availability from ${userId}:\n${message}`
        });
      }
      
      socket.emit('availability_shared', { recipients });
    } catch (error) {
      console.error('Availability sharing error:', error);
      socket.emit('availability_share_error', { error: error.message });
    }
  }

  private async syncGoogleCalendar(userId: string): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items.map(event => ({
      id: event.id!,
      title: event.summary!,
      start: new Date(event.start?.dateTime || event.start?.date!),
      end: new Date(event.end?.dateTime || event.end?.date!),
      description: event.description,
      location: event.location,
      attendees: event.attendees?.map(a => a.email!),
      source: 'google'
    }));
  }

  private async syncOutlookCalendar(userId: string): Promise<CalendarEvent[]> {
    const response = await this.outlookClient
      .api('/me/calendar/events')
      .get();

    return response.value.map((event: any) => ({
      id: event.id,
      title: event.subject,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      description: event.bodyPreview,
      location: event.location?.displayName,
      attendees: event.attendees?.map((a: any) => a.emailAddress.address),
      source: 'outlook'
    }));
  }

  private async syncAppleCalendar(userId: string): Promise<CalendarEvent[]> {
    // TODO: Implement Apple Calendar sync
    return [];
  }

  private async getAllCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    const providers = ['google', 'outlook', 'apple'];
    let allEvents: CalendarEvent[] = [];

    for (const provider of providers) {
      const cachedEvents = await this.redis.get(`calendar:${userId}:${provider}`);
      if (cachedEvents) {
        allEvents = allEvents.concat(await this.decryptData(cachedEvents));
      }
    }

    return allEvents;
  }

  private calculateAvailability(events: CalendarEvent[], duration: number, days: number): AvailabilitySlot[] {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const slots: AvailabilitySlot[] = [];

    // Sort events by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Find gaps between events
    let currentTime = now;
    for (const event of events) {
      if (event.start > currentTime) {
        const gap = event.start.getTime() - currentTime.getTime();
        const gapMinutes = Math.floor(gap / (60 * 1000));
        
        if (gapMinutes >= duration) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(event.start),
            duration: gapMinutes
          });
        }
      }
      currentTime = new Date(Math.max(currentTime.getTime(), event.end.getTime()));
    }

    // Add remaining time until endDate
    if (currentTime < endDate) {
      const remainingMinutes = Math.floor((endDate.getTime() - currentTime.getTime()) / (60 * 1000));
      if (remainingMinutes >= duration) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(endDate),
          duration: remainingMinutes
        });
      }
    }

    return slots;
  }

  private formatAvailabilityMessage(slots: AvailabilitySlot[]): string {
    return slots.map(slot => {
      const start = slot.start.toLocaleString();
      const end = slot.end.toLocaleString();
      return `- ${start} to ${end} (${slot.duration} minutes)`;
    }).join('\n');
  }

  private async sendNotification(data: { userId: string, event: CalendarEvent, type: 'reminder' | 'alert' }) {
    const { userId, event, type } = data;
    
    // Send Slack notification
    await this.slackWebhook.send({
      text: `${type === 'reminder' ? '🔔 Reminder' : '⚠️ Alert'}: ${event.title} starts in 15 minutes`
    });

    // TODO: Send email notification
  }

  private async handleCreateEvent(req: any, res: any) {
    // TODO: Implement event creation
    res.json({ status: 'not implemented' });
  }

  private async handleGetEvents(req: any, res: any) {
    // TODO: Implement event retrieval
    res.json({ status: 'not implemented' });
  }

  private async handleSetNotifications(req: any, res: any) {
    // TODO: Implement notification settings
    res.json({ status: 'not implemented' });
  }
} 