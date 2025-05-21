import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";

export interface GmailConnection {
  id?: number;
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiry: Date;
  updatedAt?: Date;
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const callbackUrl =
      (process.env.APP_URL || "") + (process.env.OAUTH_CALLBACK_URL || "");
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      prompt: "consent",
      state: "gmail_connection",
      include_granted_scopes: true,
    });
  }

  async createCalendarEvent(
    connection: GmailConnection,
    event: {
      summary: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      location?: string;
    }
  ) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        (process.env.APP_URL || "") + (process.env.OAUTH_CALLBACK_URL || "")
      );

      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      const calendarEvent = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          location: event.location,
        },
      });

      return calendarEvent.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  async handleCallback(code: string, userId: number) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to obtain required tokens");
      }

      this.oauth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
      const profile = await gmail.users.getProfile({ userId: "me" });

      if (!profile.data.emailAddress) {
        throw new Error("Failed to get Gmail profile");
      }

      const existingConnections = await storage.getGmailConnections(userId);
      const existingConnection = existingConnections.find(
        (conn) => conn.email === profile.data.emailAddress
      );

      if (existingConnection) {
        await storage.updateGmailConnection(existingConnection.id!, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiry: new Date(tokens.expiry_date!),
          updatedAt: new Date(),
        });
      } else {
        await storage.saveGmailConnection({
          userId,
          email: profile.data.emailAddress,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiry: new Date(tokens.expiry_date!),
        });
      }

      return profile.data.emailAddress;
    } catch (error) {
      console.error("Error in handleCallback:", error);
      throw error;
    }
  }

  async extractBody(payload: any): Promise<string> {
    if (!payload) return "";

    // If the body is directly available
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    // If the payload has parts (multipart messages)
    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        // Prefer 'text/plain', but fallback to 'text/html' if needed
        if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
          const data = part.body?.data;
          if (data) {
            return Buffer.from(data, "base64").toString("utf-8");
          }
        }

        // Recursive check in nested parts
        const nested = await this.extractBody(part);
        if (nested) return nested;
      }
    }

    return "";
  }

  async getEmails(connection: GmailConnection) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        (process.env.APP_URL || "") + (process.env.OAUTH_CALLBACK_URL || "")
      );

      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        q: "in:inbox",
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          if (!message.id) {
            return null;
          }

          try {
            const fullMessage = await gmail.users.messages.get({
              userId: "me",
              id: message.id,
              format: "full",
            });

            if (!fullMessage.data.payload?.headers) {
              return null;
            }

            const headers = fullMessage.data.payload.headers;
            const subject =
              headers.find((h) => h.name === "Subject")?.value || "No Subject";
            const rawFrom = headers.find((h) => h.name === "From")?.value || "";
            const fromMatch = rawFrom.match(/^(.*?)(?:\s)?<(.+?)>$/);

            const from = fromMatch
              ? {
                  name: fromMatch[1].replace(/"/g, "").trim(),
                  email: fromMatch[2],
                }
              : { name: "", email: rawFrom };

            const to = headers.find((h) => h.name === "To")?.value || "";
            const date = new Date(
              parseInt(fullMessage.data.internalDate || "0")
            );

            let body = await this.extractBody(fullMessage.data.payload);

            return {
              id: message.id,
              subject,
              from,
              to,
              date,
              body,
              snippet: fullMessage.data.snippet || "",
            };
          } catch (error) {
            // Log the error but don't throw - we want to continue processing other messages
            console.warn(
              `Failed to fetch message ${message.id}:`,
              error instanceof Error ? error.message : String(error)
            );
            return null;
          }
        })
      );

      // Filter out null entries and sort by date
      return emails
        .filter((email): email is NonNullable<typeof email> => email !== null)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error(
        "Error fetching emails:",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }
}

export const gmailService = new GmailService();
