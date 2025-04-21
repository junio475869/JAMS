import {
  users,
  applications,
  documents,
  interviews,
  contacts,
  timelineEvents,
  interviewQuestions,
  interviewAssistance,
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
  type InterviewQuestion,
  type InsertInterviewQuestion,
  type InterviewAssistance,
  type InsertInterviewAssistance,
  ApplicationStatus,
} from "@shared/schema";
import { eq, and, desc, count, asc, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { db, pool } from "./db";

// Placeholder type - needs to be defined elsewhere
async function getAllUserGmailData(userId: number) {
  const connections = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId));

  const allApplications = [];
  const allDocuments = [];

  for (const connection of connections) {
    // Fetch applications associated with this email
    const apps = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.sourceEmail, connection.email),
        ),
      );

    allApplications.push(...apps);

    // Fetch documents associated with this email
    const docs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.sourceEmail, connection.email),
        ),
      );

    allDocuments.push(...docs);
  }

  return {
    applications: allApplications,
    documents: allDocuments,
  };
}
type InsertGmailConnection = Omit<GmailConnection, "id">;

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUID(firebaseUID: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByTeamId(teamId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Applications
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByUserId(
    userId: number,
    status?: string,
  ): Promise<Application[]>;
  getApplicationsByUserIdPaginated(
    userId: number,
    limit: number,
    offset: number,
    status?: string,
  ): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(
    id: number,
    application: Partial<Application>,
  ): Promise<Application>;
  deleteApplication(id: number): Promise<void>;
  cleanupApplications(userId: number): Promise<number>;

  // Documents
  getDocumentById(id: number): Promise<Document | undefined>;
  getDocumentsByUserId(userId: number, type?: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Interviews
  getInterviewById(id: number): Promise<Interview | undefined>;
  getInterviewsByUserId(userId: number): Promise<Interview[]>;
  getInterviewsByApplicationId(applicationId: number): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(
    id: number,
    interview: Partial<Interview>,
  ): Promise<Interview>;
  deleteInterview(id: number): Promise<void>;

  // Contacts
  getContactById(id: number): Promise<Contact | undefined>;
  getContactsByApplicationId(applicationId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<Contact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Timeline events
  getTimelineEventById(id: number): Promise<TimelineEvent | undefined>;
  getTimelineEventsByApplicationId(
    applicationId: number,
  ): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(
    id: number,
    event: Partial<TimelineEvent>,
  ): Promise<TimelineEvent>;
  deleteTimelineEvent(id: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(userId: number): Promise<{
    totalApplications: number;
    interviews: number;
    offers: number;
    completionRate: number;
    statusBreakdown: { status: string; count: number }[];
    applicationsByCompany: { company: string; count: number }[];
    applicationsByMonth: { month: string; count: number }[];
    responseRate: number;
    averageDaysToInterview: number;
    averageDaysToOffer: number;
  }>;

  // Interview Questions
  getInterviewQuestionById(id: number): Promise<InterviewQuestion | undefined>;
  getInterviewQuestionsByUserId(userId: number): Promise<InterviewQuestion[]>;
  getPublicInterviewQuestions(
    filters?: {
      company?: string;
      role?: string;
      category?: string;
      difficulty?: string;
    },
    limit?: number,
  ): Promise<InterviewQuestion[]>;
  createInterviewQuestion(
    question: InsertInterviewQuestion,
  ): Promise<InterviewQuestion>;
  updateInterviewQuestion(
    id: number,
    updates: Partial<InterviewQuestion>,
  ): Promise<InterviewQuestion>;
  deleteInterviewQuestion(id: number): Promise<void>;
  voteInterviewQuestion(
    id: number,
    userId: number,
    isUpvote: boolean,
  ): Promise<InterviewQuestion>;

  // Interview Assistance
  getInterviewAssistanceById(
    id: number,
  ): Promise<InterviewAssistance | undefined>;
  getInterviewAssistanceByUserId(
    userId: number,
  ): Promise<InterviewAssistance[]>;
  getInterviewAssistanceByInterviewId(
    interviewId: number,
  ): Promise<InterviewAssistance | undefined>;
  createInterviewAssistance(
    assistance: InsertInterviewAssistance,
  ): Promise<InterviewAssistance>;
  updateInterviewAssistance(
    id: number,
    updates: Partial<InterviewAssistance>,
  ): Promise<InterviewAssistance>;
  deleteInterviewAssistance(id: number): Promise<void>;

  // Session store
  sessionStore: any;
  getGmailConnectionsByUserId(userId: number): Promise<GmailConnection[]>;
  saveGmailConnection(
    connection: InsertGmailConnection,
  ): Promise<GmailConnection>;

  // Static Data methods
  getStaticData(): Promise<any[]>;
  createStaticData(data: { name: string; type: string }): Promise<any>;
  deleteStaticData(id: number): Promise<void>;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

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
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.id);
  }

  async getUsersByTeamId(teamId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.teamId, teamId))
      .orderBy(users.id);
  }

  async deleteUser(id: number): Promise<void> {
    // First delete related data
    await db.delete(interviews).where(eq(interviews.userId, id));
    await db.delete(documents).where(eq(documents.userId, id));
    await db.delete(contacts).where(eq(contacts.userId, id));
    await db.delete(timelineEvents).where(eq(timelineEvents.userId, id));
    await db
      .delete(interviewQuestions)
      .where(eq(interviewQuestions.userId, id));
    await db
      .delete(interviewAssistance)
      .where(eq(interviewAssistance.userId, id));

    // Then delete applications
    await db.delete(applications).where(eq(applications.userId, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
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
    search?: string,
    sortBy: string = "updatedAt",
    sortOrder: string = "desc",
  ): Promise<Application[]> {
    let query = db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    if (search) {
      query = query.where(
        or(
          sql`LOWER(${applications.company}) LIKE LOWER(${"%" + search + "%"})`,
          sql`LOWER(${applications.position}) LIKE LOWER(${"%" + search + "%"})`,
        ),
      );
    }

    // Dynamic sorting
    const column = applications[sortBy as keyof typeof applications];
    if (column) {
      query = query.orderBy(sortOrder === "desc" ? desc(column) : asc(column));
    }

    return await query.limit(limit).offset(offset);
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

  async getApplicationsCountByUserId(
    userId: number,
    status?: string,
    search?: string,
  ): Promise<number> {
    let query = db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.userId, userId));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    if (search) {
      query = query.where(
        or(
          sql`LOWER(${applications.company}) LIKE LOWER(${"%" + search + "%"})`,
          sql`LOWER(${applications.position}) LIKE LOWER(${"%" + search + "%"})`,
        ),
      );
    }

    const [result] = await query;
    return Number(result.count);
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
    updates: Partial<Application>,
  ): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<void> {
    // First delete related data
    await db.delete(interviews).where(eq(interviews.applicationId, id));
    await db.delete(contacts).where(eq(contacts.applicationId, id));
    await db.delete(timelineEvents).where(eq(timelineEvents.applicationId, id));

    // Then delete the application
    await db.delete(applications).where(eq(applications.id, id));
  }

  async cleanupApplications(userId: number): Promise<number> {
    // Remove applications with empty or invalid required fields
    const result = await db
      .delete(applications)
      .where(
        and(
          eq(applications.userId, userId),
          or(
            sql`${applications.company} = ''`,
            sql`${applications.position} = ''`,
            sql`${applications.company} IS NULL`,
            sql`${applications.position} IS NULL`,
          ),
        ),
      )
      .returning();

    return result.length;
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
    if (type) {
      return await db
        .select()
        .from(documents)
        .where(and(eq(documents.userId, userId), eq(documents.type, type)))
        .orderBy(desc(documents.updatedAt));
    } else {
      return await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.updatedAt));
    }
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
      .orderBy(desc(interviews.date));
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

    // Update the application's lastActivity
    if (newEvent.applicationId) {
      await db
        .update(applications)
        .set({ updatedAt: new Date() })
        .where(eq(applications.id, newEvent.applicationId));
    }

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

  // Dashboard stats
  async getDashboardStats(userId: number): Promise<{
    totalApplications: number;
    interviews: number;
    offers: number;
    completionRate: number;
    statusBreakdown: { status: string; count: number }[];
    applicationsByCompany: { company: string; count: number }[];
    applicationsByMonth: { month: string; count: number }[];
    responseRate: number;
    averageDaysToInterview: number;
    averageDaysToOffer: number;
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
        and(
          eq(applications.userId, userId),
          eq(applications.status, ApplicationStatus.OFFER),
        ),
      );

    // Calculate completion rate
    // (completed applications / total applications) * 100
    const [{ count: completedApplications }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, ApplicationStatus.REJECTED),
        ),
      );

    const [{ count: acceptedApplications }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, ApplicationStatus.ACCEPTED),
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

    // Get status breakdown
    const userApplications = await db
      .select({
        status: applications.status,
        id: applications.id,
        appliedDate: applications.appliedDate,
        company: applications.company,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId));

    // Calculate status breakdown
    const statusCounts: Record<string, number> = {};
    userApplications.forEach((app) => {
      const status = app.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    // Calculate applications by company
    const companyCounts: Record<string, number> = {};
    userApplications.forEach((app) => {
      const company = app.company || "Unknown";
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    // Sort by count descending and take top 10
    const applicationsByCompany = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate applications by month
    const monthCounts: Record<string, number> = {};
    userApplications.forEach((app) => {
      let date: Date | null = null;
      if (app.appliedDate instanceof Date) {
        date = app.appliedDate;
      } else if (app.appliedDate) {
        date = new Date(app.appliedDate);
      } else if (app.createdAt) {
        date = new Date(app.createdAt);
      }

      if (!date) {
        return; // Skip this application if no date is available
      }

      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });

    // Convert to array and sort by date
    const monthsOrder: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const applicationsByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");

        if (aYear !== bYear) {
          return parseInt(aYear) - parseInt(bYear);
        }

        return monthsOrder[aMonth] - monthsOrder[bMonth];
      });

    // Calculate response rate (applications with interviews / total applications)
    const [{ count: applicationsWithInterviews }] = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, ApplicationStatus.INTERVIEW),
        ),
      );

    const responseRate =
      Number(totalApplications) > 0
        ? ((Number(applicationsWithInterviews) +
            Number(offersCount) +
            Number(acceptedApplications)) /
            Number(totalApplications)) *
          100
        : 0;

    // Calculate average days to interview
    // For each application with interviews, find the earliest interview date and calculate days from application date
    let totalDaysToInterview = 0;
    let interviewsWithDates = 0;

    // Fetch all interviews with their associated applications
    const interviewsWithApplications = await db
      .select({
        interviewDate: interviews.date,
        applicationDate: applications.appliedDate,
        applicationCreatedAt: applications.createdAt,
      })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .where(eq(interviews.userId, userId));

    interviewsWithApplications.forEach((item) => {
      if (item.interviewDate) {
        const interviewDate = new Date(item.interviewDate);
        let applicationDate: Date | null = null;

        if (item.applicationDate) {
          applicationDate = new Date(item.applicationDate);
        } else if (item.applicationCreatedAt) {
          applicationDate = new Date(item.applicationCreatedAt);
        }

        if (!applicationDate) {
          return; // Skip if no date is available
        }

        const diffTime = Math.abs(
          interviewDate.getTime() - applicationDate.getTime(),
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        totalDaysToInterview += diffDays;
        interviewsWithDates++;
      }
    });

    const averageDaysToInterview =
      interviewsWithDates > 0 ? totalDaysToInterview / interviewsWithDates : 0;

    // Calculate average days to offer
    // For each application with OFFER status, calculate days from application date to last status change
    const applicationsWithOffers = userApplications.filter(
      (app) =>
        app.status === ApplicationStatus.OFFER ||
        app.status === ApplicationStatus.ACCEPTED,
    );

    let totalDaysToOffer = 0;
    let offersWithDates = 0;

    // For each offer application, find the date when status changed to OFFER
    for (const app of applicationsWithOffers) {
      const timelineEntries = await db
        .select({
          date: timelineEvents.date,
          type: timelineEvents.type,
        })
        .from(timelineEvents)
        .where(
          and(
            eq(timelineEvents.applicationId, app.id),
            eq(timelineEvents.type, "offer"),
          ),
        )
        .orderBy(timelineEvents.date);

      if (timelineEntries.length > 0 && timelineEntries[0].date) {
        const offerDate = new Date(timelineEntries[0].date);
        let applicationDate: Date | null = null;

        if (app.appliedDate) {
          applicationDate = new Date(app.appliedDate);
        } else if (app.createdAt) {
          applicationDate = new Date(app.createdAt);
        }

        if (!applicationDate) {
          continue; // Skip if no date is available
        }

        const diffTime = Math.abs(
          offerDate.getTime() - applicationDate.getTime(),
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        totalDaysToOffer += diffDays;
        offersWithDates++;
      }
    }

    const averageDaysToOffer =
      offersWithDates > 0 ? totalDaysToOffer / offersWithDates : 0;

    return {
      totalApplications: Number(totalApplications),
      interviews: Number(interviewsCount),
      offers: Number(offersCount),
      completionRate,
      statusBreakdown,
      applicationsByCompany,
      applicationsByMonth,
      responseRate,
      averageDaysToInterview,
      averageDaysToOffer,
    };
  }

  // Interview Question methods
  async getInterviewQuestionById(
    id: number,
  ): Promise<InterviewQuestion | undefined> {
    const [question] = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.id, id));
    return question;
  }

  async getInterviewQuestionsByUserId(
    userId: number,
  ): Promise<InterviewQuestion[]> {
    return await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.userId, userId))
      .orderBy(desc(interviewQuestions.updatedAt));
  }

  async getPublicInterviewQuestions(
    filters?: {
      company?: string;
      role?: string;
      category?: string;
      difficulty?: string;
    },
    limit?: number,
  ): Promise<InterviewQuestion[]> {
    // Start with the base condition
    let conditions = [eq(interviewQuestions.public, true)];

    // Add additional conditions based on filters
    if (filters) {
      if (filters.company) {
        conditions.push(eq(interviewQuestions.company, filters.company));
      }
      if (filters.role) {
        conditions.push(eq(interviewQuestions.role, filters.role));
      }
      if (filters.category) {
        conditions.push(eq(interviewQuestions.category, filters.category));
      }
      if (filters.difficulty) {
        conditions.push(eq(interviewQuestions.difficulty, filters.difficulty));
      }
    }

    // Combine all conditions with AND
    const query = db
      .select()
      .from(interviewQuestions)
      .where(and(...conditions))
      .orderBy(desc(interviewQuestions.upvotes));

    // Apply limit if provided
    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }

  async createInterviewQuestion(
    question: InsertInterviewQuestion,
  ): Promise<InterviewQuestion> {
    const [newQuestion] = await db
      .insert(interviewQuestions)
      .values({
        ...question,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newQuestion;
  }

  async updateInterviewQuestion(
    id: number,
    updates: Partial<InterviewQuestion>,
  ): Promise<InterviewQuestion> {
    const [updatedQuestion] = await db
      .update(interviewQuestions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(interviewQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteInterviewQuestion(id: number): Promise<void> {
    await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id));
  }

  async voteInterviewQuestion(
    id: number,
    userId: number,
    isUpvote: boolean,
  ): Promise<InterviewQuestion> {
    // First retrieve the current question
    const [question] = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.id, id));

    if (!question) {
      throw new Error("Interview question not found");
    }

    // Calculate new vote counts
    const newUpvotes = isUpvote
      ? (question.upvotes || 0) + 1
      : question.upvotes || 0;
    const newDownvotes = !isUpvote
      ? (question.downvotes || 0) + 1
      : question.downvotes || 0;

    // Update the question
    const [updatedQuestion] = await db
      .update(interviewQuestions)
      .set({
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        updatedAt: new Date(),
      })
      .where(eq(interviewQuestions.id, id))
      .returning();

    return updatedQuestion;
  }

  // Interview Assistance methods
  async getInterviewAssistanceById(
    id: number,
  ): Promise<InterviewAssistance | undefined> {
    const [assistance] = await db
      .select()
      .from(interviewAssistance)
      .where(eq(interviewAssistance.id, id));
    return assistance;
  }

  async getInterviewAssistanceByUserId(
    userId: number,
  ): Promise<InterviewAssistance[]> {
    return await db
      .select()
      .from(interviewAssistance)
      .where(eq(interviewAssistance.userId, userId))
      .orderBy(desc(interviewAssistance.createdAt));
  }

  async getInterviewAssistanceByInterviewId(
    interviewId: number,
  ): Promise<InterviewAssistance | undefined> {
    const [assistance] = await db
      .select()
      .from(interviewAssistance)
      .where(eq(interviewAssistance.interviewId, interviewId));
    return assistance;
  }

  async createInterviewAssistance(
    assistance: InsertInterviewAssistance,
  ): Promise<InterviewAssistance> {
    const [newAssistance] = await db
      .insert(interviewAssistance)
      .values({
        ...assistance,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newAssistance;
  }

  async updateInterviewAssistance(
    id: number,
    updates: Partial<InterviewAssistance>,
  ): Promise<InterviewAssistance> {
    const [updatedAssistance] = await db
      .update(interviewAssistance)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(interviewAssistance.id, id))
      .returning();
    return updatedAssistance;
  }

  async deleteInterviewAssistance(id: number): Promise<void> {
    await db.delete(interviewAssistance).where(eq(interviewAssistance.id, id));
  }

  async getGmailConnectionsByUserId(
    userId: number,
  ): Promise<GmailConnection[]> {
    // Implement Gmail connection retrieval logic here.  This is a placeholder.
    return [];
  }

  async saveGmailConnection(
    connection: InsertGmailConnection,
  ): Promise<GmailConnection> {
    // Implement Gmail connection saving logic here. This is a placeholder.
    return { id: 1, ...connection };
  }

  async getStaticData(): Promise<any[]> {
    // Placeholder for static data table - replace with your actual table name
    const staticData = db.select().from(staticData);
    return staticData;
  }

  async createStaticData({
    name,
    type,
  }: {
    name: string;
    type: string;
  }): Promise<any> {
    // Placeholder for static data table - replace with your actual table name
    const [newItem] = await db
      .insert(staticData)
      .values({ name, type })
      .returning();
    return newItem;
  }

  async deleteStaticData(id: number): Promise<void> {
    // Placeholder for static data table - replace with your actual table name
    await db.delete(staticData).where(eq(staticData.id, id));
  }
}

export const storage = new DatabaseStorage();
