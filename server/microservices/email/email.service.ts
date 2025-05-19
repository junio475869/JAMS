import { BaseMicroservice } from '../base.service';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { OpenAI } from 'openai';
import { Queue } from 'bull';

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
  category: EmailCategory;
  labels: string[];
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

type EmailCategory = 
  | 'Job Application Confirmation'
  | 'Interview Invite'
  | 'Recruiter Outreach'
  | 'Availability Request'
  | 'Offer Communication'
  | 'Rejection'
  | 'Follow-up Required';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: EmailCategory;
}

export class EmailService extends BaseMicroservice {
  private openai: OpenAI;
  private gmailClient: any;
  private outlookClient: Client;
  private processingQueue: Queue;

  constructor(app: any, io: any, redis: any) {
    super(app, io, redis);
    this.openai = new OpenAI();
    this.gmailClient = google.gmail({ version: 'v1' });
    this.outlookClient = Client.init({
      authProvider: (done) => {
        done(null, process.env.OUTLOOK_ACCESS_TOKEN);
      }
    });
    this.processingQueue = new Queue('email-processing', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }

  async initialize(): Promise<void> {
    // Initialize WebSocket handlers
    this.io.on('connection', (socket) => {
      socket.on('sync_emails', this.handleEmailSync.bind(this));
      socket.on('send_email', this.handleSendEmail.bind(this));
      socket.on('create_template', this.handleCreateTemplate.bind(this));
    });

    // Initialize REST endpoints
    this.app.get('/api/emails', this.handleGetEmails.bind(this));
    this.app.post('/api/emails/send', this.handleSendEmail.bind(this));
    this.app.get('/api/emails/templates', this.handleGetTemplates.bind(this));
    this.app.post('/api/emails/templates', this.handleCreateTemplate.bind(this));

    // Initialize email processing queue
    this.processingQueue.process(async (job) => {
      await this.processEmail(job.data);
    });
  }

  async cleanup(): Promise<void> {
    await this.processingQueue.close();
  }

  private async handleEmailSync(socket: any, data: { userId: string, provider: 'gmail' | 'outlook' }) {
    const { userId, provider } = data;
    
    try {
      let emails: Email[] = [];
      
      switch (provider) {
        case 'gmail':
          emails = await this.syncGmailEmails(userId);
          break;
        case 'outlook':
          emails = await this.syncOutlookEmails(userId);
          break;
      }

      // Process emails with AI
      for (const email of emails) {
        await this.processingQueue.add({
          email,
          userId,
          provider
        });
      }

      socket.emit('emails_synced', { provider, count: emails.length });
    } catch (error) {
      console.error('Email sync error:', error);
      socket.emit('email_sync_error', { provider, error: error.message });
    }
  }

  private async handleSendEmail(socket: any, data: { 
    userId: string, 
    to: string[], 
    subject: string, 
    body: string,
    templateId?: string,
    variables?: Record<string, string>
  }) {
    const { userId, to, subject, body, templateId, variables } = data;
    
    try {
      let finalBody = body;
      
      // Apply template if provided
      if (templateId && variables) {
        const template = await this.getEmailTemplate(templateId);
        finalBody = this.applyTemplate(template, variables);
      }

      // Send email
      await this.sendEmail(userId, to, subject, finalBody);
      
      socket.emit('email_sent', { to, subject });
    } catch (error) {
      console.error('Email sending error:', error);
      socket.emit('email_send_error', { error: error.message });
    }
  }

  private async handleCreateTemplate(socket: any, data: {
    userId: string,
    name: string,
    subject: string,
    body: string,
    variables: string[],
    category: EmailCategory
  }) {
    const { userId, name, subject, body, variables, category } = data;
    
    try {
      const template = await this.createEmailTemplate({
        id: crypto.randomUUID(),
        name,
        subject,
        body,
        variables,
        category
      });
      
      socket.emit('template_created', template);
    } catch (error) {
      console.error('Template creation error:', error);
      socket.emit('template_creation_error', { error: error.message });
    }
  }

  private async syncGmailEmails(userId: string): Promise<Email[]> {
    const response = await this.gmailClient.users.messages.list({
      userId: 'me',
      maxResults: 100
    });

    const emails: Email[] = [];
    for (const message of response.data.messages) {
      const email = await this.gmailClient.users.messages.get({
        userId: 'me',
        id: message.id
      });

      emails.push(this.parseGmailMessage(email.data));
    }

    return emails;
  }

  private async syncOutlookEmails(userId: string): Promise<Email[]> {
    const response = await this.outlookClient
      .api('/me/messages')
      .get();

    return response.value.map(this.parseOutlookMessage);
  }

  private parseGmailMessage(message: any): Email {
    const headers = message.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value;

    return {
      id: message.id,
      from: getHeader('From'),
      to: getHeader('To').split(','),
      subject: getHeader('Subject'),
      body: this.decodeGmailBody(message.payload),
      date: new Date(getHeader('Date')),
      category: 'Recruiter Outreach', // Will be updated by AI
      labels: message.labelIds || []
    };
  }

  private parseOutlookMessage(message: any): Email {
    return {
      id: message.id,
      from: message.from.emailAddress.address,
      to: message.toRecipients.map((r: any) => r.emailAddress.address),
      subject: message.subject,
      body: message.body.content,
      date: new Date(message.receivedDateTime),
      category: 'Recruiter Outreach', // Will be updated by AI
      labels: message.categories || []
    };
  }

  private decodeGmailBody(payload: any): string {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      const textPart = payload.parts.find((part: any) => part.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        return Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return '';
  }

  private async processEmail(data: { email: Email, userId: string, provider: string }) {
    const { email, userId } = data;

    // Categorize email using AI
    const category = await this.categorizeEmail(email);
    email.category = category;

    // Store in Redis
    await this.redis.set(
      `email:${userId}:${email.id}`,
      await this.encryptData(email),
      'EX',
      86400 // 24 hours cache
    );

    // Emit update to connected clients
    this.io.to(userId).emit('email_processed', {
      id: email.id,
      category
    });
  }

  private async categorizeEmail(email: Email): Promise<EmailCategory> {
    const prompt = `Categorize this email as one of: Job Application Confirmation, Interview Invite, Recruiter Outreach, Availability Request, Offer Communication, Rejection, Follow-up Required.

Email:
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}...`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content as EmailCategory;
  }

  private async sendEmail(userId: string, to: string[], subject: string, body: string) {
    // TODO: Implement email sending
    console.log('Sending email:', { to, subject });
  }

  private async getEmailTemplate(templateId: string): Promise<EmailTemplate> {
    const template = await this.redis.get(`template:${templateId}`);
    if (!template) {
      throw new Error('Template not found');
    }
    return this.decryptData(template);
  }

  private async createEmailTemplate(template: EmailTemplate): Promise<EmailTemplate> {
    await this.redis.set(
      `template:${template.id}`,
      await this.encryptData(template)
    );
    return template;
  }

  private applyTemplate(template: EmailTemplate, variables: Record<string, string>): string {
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return body;
  }

  private async handleGetEmails(req: any, res: any) {
    // TODO: Implement email retrieval
    res.json({ status: 'not implemented' });
  }

  private async handleGetTemplates(req: any, res: any) {
    // TODO: Implement template retrieval
    res.json({ status: 'not implemented' });
  }
} 