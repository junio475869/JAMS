import {
  users,
  applications,
  documents,
  interviews,
  contacts,
  timelineEvents,
  type User,
  type InsertUser,
  type Application,
  type InsertApplication,
  type Document,
  type InsertDocument,
  type Interview,
  type InsertInterview,
  type Contact,
  type InsertContact,
  type TimelineEvent,
  type InsertTimelineEvent,
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { db, pool } from "./db";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  async getGmailConnectionsByUserId(
    userId: number,
  ): Promise<GmailConnection[]> {
    return await db
      .select()
      .from(gmailConnections)
      .where(eq(gmailConnections.userId, userId));
  }

  async saveGmailConnection(
    connection: InsertGmailConnection,
  ): Promise<GmailConnection> {
    const [newConnection] = await db
      .insert(gmailConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUID(firebaseUID: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUID, firebaseUID));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Application methods
  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application;
  }

  async getApplicationsByUserId(
    userId: number,
    status?: string,
  ): Promise<Application[]> {
    let query = db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    return await query.orderBy(desc(applications.updatedAt));
  }

  async getApplicationsByUserIdPaginated(
    userId: number,
    limit: number,
    offset: number,
    status?: string,
  ): Promise<Application[]> {
    let query = db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    return await query
      .orderBy(desc(applications.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async createApplication(
    application: InsertApplication,
  ): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values({
        ...application,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newApplication;
  }

  async updateApplication(
    id: number,
    updates: Partial<Application> & { interviewSteps?: any[] },
  ): Promise<Application> {
    // Remove interviewSteps from updates since it's not a column
    const { interviewSteps, ...applicationUpdates } = updates;
    
    const [updatedApplication] = await db
      .update(applications)
      .set({
        ...applicationUpdates,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  // Document methods
  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByUserId(
    userId: number,
    type?: string,
  ): Promise<Document[]> {
    let query = db.select().from(documents).where(eq(documents.userId, userId));

    if (type) {
      query = query.where(eq(documents.type, type));
    }

    return await query.orderBy(desc(documents.updatedAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newDocument;
  }

  async updateDocument(
    id: number,
    updates: Partial<Document>,
  ): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Interview methods
  async getInterviewById(id: number): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id));
    return interview;
  }

  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.scheduledAt));
  }

  async getInterviewsByApplicationId(
    applicationId: number,
  ): Promise<Interview[]> {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(desc(interviews.scheduledAt));
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values({
        ...interview,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newInterview;
  }

  async updateInterview(
    id: number,
    updates: Partial<Interview>,
  ): Promise<Interview> {
    const [updatedInterview] = await db
      .update(interviews)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview;
  }

  async deleteInterview(id: number): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  // Contact methods
  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact;
  }

  async getContactsByApplicationId(applicationId: number): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.applicationId, applicationId))
      .orderBy(desc(contacts.createdAt));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values({
        ...contact,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newContact;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Timeline events methods
  async getTimelineEventById(id: number): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.id, id));
    return event;
  }

  async getTimelineEventsByApplicationId(
    applicationId: number,
  ): Promise<TimelineEvent[]> {
    return await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.applicationId, applicationId))
      .orderBy(desc(timelineEvents.date));
  }

  async createTimelineEvent(
    event: InsertTimelineEvent,
  ): Promise<TimelineEvent> {
    const [newEvent] = await db
      .insert(timelineEvents)
      .values({
        ...event,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEvent;
  }

  async updateTimelineEvent(
    id: number,
    updates: Partial<TimelineEvent>,
  ): Promise<TimelineEvent> {
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(timelineEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }

  // Interview Steps methods
  async getInterviewStepsByApplicationId(
    applicationId: number,
  ): Promise<InterviewStep[]> {
    return await db
      .select()
      .from(interviewSteps)
      .where(eq(interviewSteps.applicationId, applicationId))
      .orderBy(interviewSteps.sequence);
  }

  async createInterviewStep(step: InsertInterviewStep): Promise<InterviewStep> {
    const [newStep] = await db
      .insert(interviewSteps)
      .values({
        ...step,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newStep;
  }

  async updateInterviewStep(
    id: number,
    updates: Partial<InterviewStep>,
  ): Promise<InterviewStep> {
    const [updatedStep] = await db
      .update(interviewSteps)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(interviewSteps.id, id))
      .returning();
    return updatedStep;
  }

  async deleteInterviewStep(id: number): Promise<void> {
    await db.delete(interviewSteps).where(eq(interviewSteps.id, id));
  }

  // Dashboard stats
  async getDashboardStats(userId: number): Promise<{
    totalApplications: number;
    interviews: number;
    offers: number;
    completionRate: number;
  }> {
    // Get total applications count
    const [{ count: totalApplications }] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.userId, userId));

    // Get interviews count
    const [{ count: interviewsCount }] = await db
      .select({ count: count() })
      .from(interviews)
      .where(eq(interviews.userId, userId));

    // Get offers count (applications with status 'OFFER')
    const [{ count: offersCount }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(eq(applications.userId, userId), eq(applications.status, "OFFER")),
      );

    // Calculate completion rate
    // (completed applications / total applications) * 100
    const [{ count: completedApplications }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, "REJECTED"),
        ),
      );

    const [{ count: acceptedApplications }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, "ACCEPTED"),
        ),
      );

    const totalCompleted =
      Number(completedApplications) +
      Number(acceptedApplications) +
      Number(offersCount);
    const completionRate =
      Number(totalApplications) > 0
        ? (totalCompleted / Number(totalApplications)) * 100
        : 0;

    return {
      totalApplications: Number(totalApplications),
      interviews: Number(interviewsCount),
      offers: Number(offersCount),
      completionRate,
    };
  }
}
