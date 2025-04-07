
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

export interface GmailConnection {
  userId: number;
  email: string; 
  accessToken: string;
  refreshToken: string;
  expiry: Date;
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/gmail/oauth/callback`
    );
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'
    });
  }

  async handleCallback(code: string, userId: number) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    await storage.saveGmailConnection({
      userId,
      email: profile.data.emailAddress!,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiry: new Date(tokens.expiry_date!)
    });
  }

  async getEmails(connection: GmailConnection) {
    try {
      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        q: 'in:inbox'
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const headers = fullMessage.data.payload?.headers;
          const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers?.find(h => h.name === 'From')?.value || '';
          const to = headers?.find(h => h.name === 'To')?.value || '';
          const date = new Date(parseInt(fullMessage.data.internalDate!));
          
          let body = '';
          if (fullMessage.data.payload?.body?.data) {
            body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString();
          }

          return {
            id: message.id!,
            subject,
            from,
            to,
            date,
            body,
            snippet: fullMessage.data.snippet || ''
          };
        })
      );

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
}

export const gmailService = new GmailService();
