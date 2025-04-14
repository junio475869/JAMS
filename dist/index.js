// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var UserRole = {
  ADMIN: "admin",
  GROUP_LEADER: "group_leader",
  JOB_SEEKER: "job_seeker",
  JOB_BIDDER: "job_bidder"
};
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profilePicture: text("profile_picture"),
  firebaseUID: text("firebase_uid").unique(),
  role: text("role").notNull().default(UserRole.JOB_SEEKER),
  teamId: integer("team_id"),
  // For group members to be associated with a team
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  profilePicture: true,
  firebaseUID: true,
  role: true,
  teamId: true
});
var applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("applied"),
  url: text("url"),
  description: text("description"),
  notes: text("notes"),
  jobType: text("job_type"),
  companyLogo: text("company_logo"),
  salary: text("salary"),
  remoteType: text("remote_type"),
  location: text("location"),
  jobSource: text("job_source"),
  platform: text("platform"),
  platformJobId: text("platform_job_id"),
  publicationDate: timestamp("publication_date"),
  appliedDate: timestamp("applied_date").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertApplicationSchema = createInsertSchema(applications).pick({
  userId: true,
  company: true,
  position: true,
  status: true,
  url: true,
  description: true,
  notes: true,
  appliedDate: true
});
var interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(),
  // 'phone', 'technical', 'onsite', 'hr', 'panel'
  date: timestamp("date"),
  duration: integer("duration"),
  // in minutes
  location: text("location"),
  notes: text("notes"),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  completed: boolean("completed").default(false),
  feedback: text("feedback").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'resume', 'cover_letter'
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  name: true,
  type: true,
  content: true,
  version: true
});
var interviewSteps = pgTable("interview_steps", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  stepName: text("step_name").notNull(),
  sequence: integer("sequence").notNull(),
  interviewerName: text("interviewer_name"),
  interviewerLinkedIn: text("interviewer_linkedin"),
  meetingUrl: text("meeting_url"),
  scheduledDate: timestamp("scheduled_date"),
  duration: integer("duration"),
  // minutes
  comments: text("comments"),
  feedback: text("feedback"),
  interviewer: integer("interviewer").references(() => users.id),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInterviewStepSchema = createInsertSchema(interviewSteps);
var insertInterviewSchema = createInsertSchema(interviews).pick({
  applicationId: true,
  userId: true,
  title: true,
  company: true,
  type: true,
  date: true,
  duration: true,
  location: true,
  notes: true
});
var contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertContactSchema = createInsertSchema(contacts).pick({
  applicationId: true,
  userId: true,
  name: true,
  title: true,
  email: true,
  phone: true,
  notes: true
});
var timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  type: text("type").notNull(),
  // 'application', 'interview', 'offer', 'rejection', 'note'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertTimelineEventSchema = createInsertSchema(timelineEvents).pick({
  applicationId: true,
  userId: true,
  title: true,
  description: true,
  date: true,
  type: true
});
var ApplicationStatus = {
  APPLIED: "applied",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
  ACCEPTED: "accepted"
};
var DocumentType = {
  RESUME: "resume",
  COVER_LETTER: "cover_letter"
};
var interviewFeedback = pgTable("interview_feedback", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comments: text("comments").notNull(),
  videoUrl: text("video_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).pick({
  interviewId: true,
  userId: true,
  comments: true,
  videoUrl: true,
  tags: true
});
var interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  company: text("company").notNull(),
  role: text("role").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  category: text("category").notNull(),
  // "behavioral", "technical", "situational", "company", "other"
  difficulty: text("difficulty").notNull(),
  // "easy", "medium", "hard"
  aiGenerated: boolean("ai_generated").default(false),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  public: boolean("public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).pick({
  userId: true,
  company: true,
  role: true,
  question: true,
  answer: true,
  category: true,
  difficulty: true,
  aiGenerated: true,
  public: true
});
var interviewAssistance = pgTable("interview_assistance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interviewId: integer("interview_id").references(() => interviews.id),
  transcriptText: text("transcript_text"),
  questions: jsonb("questions").notNull(),
  responses: jsonb("responses").notNull(),
  feedback: jsonb("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInterviewAssistanceSchema = createInsertSchema(interviewAssistance).pick({
  userId: true,
  interviewId: true,
  transcriptText: true,
  questions: true,
  responses: true,
  feedback: true
});
var jobProfiles = pgTable("job_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  skills: jsonb("skills").default([]).notNull(),
  experience: jsonb("experience").default([]).notNull(),
  education: jsonb("education").default([]).notNull(),
  defaultResume: integer("default_resume").references(() => documents.id),
  defaultCoverLetter: integer("default_cover_letter").references(() => documents.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertJobProfileSchema = createInsertSchema(jobProfiles).pick({
  userId: true,
  name: true,
  title: true,
  summary: true,
  skills: true,
  experience: true,
  education: true,
  defaultResume: true,
  defaultCoverLetter: true
});
var chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'direct', 'group', 'channel'
  createdBy: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertChatChannelSchema = createInsertSchema(chatChannels).pick({
  name: true,
  type: true,
  createdBy: true,
  isPrivate: true
});
var chatChannelMembers = pgTable("chat_channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member").notNull(),
  // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastRead: timestamp("last_read").defaultNow()
});
var insertChatChannelMemberSchema = createInsertSchema(chatChannelMembers).pick({
  channelId: true,
  userId: true,
  role: true
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),
  type: text("type").default("text").notNull(),
  // 'text', 'image', 'file', 'voice', 'video'
  attachmentUrl: text("attachment_url"),
  reactions: jsonb("reactions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false)
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  channelId: true,
  userId: true,
  content: true,
  type: true,
  attachmentUrl: true,
  reactions: true
});
var gmailConnections2 = pgTable("gmail_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiry: timestamp("expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertGmailConnectionSchema = createInsertSchema(gmailConnections2);

// server/storage.ts
import { eq, and, desc, count, asc, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://avnadmin:AVNS_TSHCpCN-1ASEeI4spMD@pg-ada48aa-junio475869-6768.b.aivencloud.com:24381/defaultdb",
  ssl: {
    ca: readFileSync(join(__dirname, "..", "cert.pem")).toString(),
    rejectUnauthorized: true
  },
  max: 20,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
var db = drizzle(pool);
pool.on("connect", () => {
  console.log("Database connected successfully");
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// server/storage.ts
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByFirebaseUID(firebaseUID) {
    const [user] = await db.select().from(users).where(eq(users.firebaseUID, firebaseUID));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(users.id);
  }
  async getUsersByTeamId(teamId) {
    return await db.select().from(users).where(eq(users.teamId, teamId)).orderBy(users.id);
  }
  async deleteUser(id) {
    await db.delete(interviews).where(eq(interviews.userId, id));
    await db.delete(documents).where(eq(documents.userId, id));
    await db.delete(contacts).where(eq(contacts.userId, id));
    await db.delete(timelineEvents).where(eq(timelineEvents.userId, id));
    await db.delete(interviewQuestions).where(eq(interviewQuestions.userId, id));
    await db.delete(interviewAssistance).where(eq(interviewAssistance.userId, id));
    await db.delete(applications).where(eq(applications.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
  // Application methods
  async getApplicationById(id) {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }
  async getApplicationsByUserId(userId, status) {
    let query = db.select().from(applications).where(eq(applications.userId, userId));
    if (status) {
      query = query.where(eq(applications.status, status));
    }
    return await query.orderBy(desc(applications.updatedAt));
  }
  async getApplicationsByUserIdPaginated(userId, limit, offset, status, search, sortBy = "updatedAt", sortOrder = "desc") {
    let query = db.select().from(applications).where(eq(applications.userId, userId));
    if (status) {
      query = query.where(eq(applications.status, status));
    }
    if (search) {
      query = query.where(
        or(
          sql`LOWER(${applications.company}) LIKE LOWER(${"%" + search + "%"})`,
          sql`LOWER(${applications.position}) LIKE LOWER(${"%" + search + "%"})`
        )
      );
    }
    const column = applications[sortBy];
    if (column) {
      query = query.orderBy(sortOrder === "desc" ? desc(column) : asc(column));
    }
    return await query.limit(limit).offset(offset);
  }
  async getApplicationsCountByUserId(userId, status, search) {
    let query = db.select({ count: count() }).from(applications).where(eq(applications.userId, userId));
    if (status) {
      query = query.where(eq(applications.status, status));
    }
    if (search) {
      query = query.where(
        or(
          sql`LOWER(${applications.company}) LIKE LOWER(${"%" + search + "%"})`,
          sql`LOWER(${applications.position}) LIKE LOWER(${"%" + search + "%"})`
        )
      );
    }
    const [result] = await query;
    return Number(result.count);
  }
  async getApplicationsCountByUserId(userId) {
    const [result] = await db.select({ count: count() }).from(applications).where(eq(applications.userId, userId));
    return Number(result.count);
  }
  async createApplication(application) {
    const [newApplication] = await db.insert(applications).values({
      ...application,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newApplication;
  }
  async updateApplication(id, updates) {
    const [updatedApplication] = await db.update(applications).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(applications.id, id)).returning();
    return updatedApplication;
  }
  async deleteApplication(id) {
    await db.delete(interviews).where(eq(interviews.applicationId, id));
    await db.delete(contacts).where(eq(contacts.applicationId, id));
    await db.delete(timelineEvents).where(eq(timelineEvents.applicationId, id));
    await db.delete(applications).where(eq(applications.id, id));
  }
  async cleanupApplications(userId) {
    const result = await db.delete(applications).where(
      and(
        eq(applications.userId, userId),
        or(
          sql`${applications.company} = ''`,
          sql`${applications.position} = ''`,
          sql`${applications.company} IS NULL`,
          sql`${applications.position} IS NULL`
        )
      )
    ).returning();
    return result.length;
  }
  // Document methods
  async getDocumentById(id) {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  async getDocumentsByUserId(userId, type) {
    if (type) {
      return await db.select().from(documents).where(and(
        eq(documents.userId, userId),
        eq(documents.type, type)
      )).orderBy(desc(documents.updatedAt));
    } else {
      return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.updatedAt));
    }
  }
  async createDocument(document) {
    const [newDocument] = await db.insert(documents).values({
      ...document,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newDocument;
  }
  async updateDocument(id, updates) {
    const [updatedDocument] = await db.update(documents).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(documents.id, id)).returning();
    return updatedDocument;
  }
  async deleteDocument(id) {
    await db.delete(documents).where(eq(documents.id, id));
  }
  // Interview methods
  async getInterviewById(id) {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }
  async getInterviewsByUserId(userId) {
    return await db.select().from(interviews).where(eq(interviews.userId, userId)).orderBy(desc(interviews.scheduledAt));
  }
  async getInterviewsByApplicationId(applicationId) {
    return await db.select().from(interviews).where(eq(interviews.applicationId, applicationId)).orderBy(desc(interviews.date));
  }
  async createInterview(interview) {
    const [newInterview] = await db.insert(interviews).values({
      ...interview,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newInterview;
  }
  async updateInterview(id, updates) {
    const [updatedInterview] = await db.update(interviews).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(interviews.id, id)).returning();
    return updatedInterview;
  }
  async deleteInterview(id) {
    await db.delete(interviews).where(eq(interviews.id, id));
  }
  // Contact methods
  async getContactById(id) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  async getContactsByApplicationId(applicationId) {
    return await db.select().from(contacts).where(eq(contacts.applicationId, applicationId)).orderBy(desc(contacts.createdAt));
  }
  async createContact(contact) {
    const [newContact] = await db.insert(contacts).values({
      ...contact,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newContact;
  }
  async updateContact(id, updates) {
    const [updatedContact] = await db.update(contacts).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(contacts.id, id)).returning();
    return updatedContact;
  }
  async deleteContact(id) {
    await db.delete(contacts).where(eq(contacts.id, id));
  }
  // Timeline events methods
  async getTimelineEventById(id) {
    const [event] = await db.select().from(timelineEvents).where(eq(timelineEvents.id, id));
    return event;
  }
  async getTimelineEventsByApplicationId(applicationId) {
    return await db.select().from(timelineEvents).where(eq(timelineEvents.applicationId, applicationId)).orderBy(desc(timelineEvents.date));
  }
  async createTimelineEvent(event) {
    const [newEvent] = await db.insert(timelineEvents).values({
      ...event,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    if (newEvent.applicationId) {
      await db.update(applications).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(applications.id, newEvent.applicationId));
    }
    return newEvent;
  }
  async updateTimelineEvent(id, updates) {
    const [updatedEvent] = await db.update(timelineEvents).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(timelineEvents.id, id)).returning();
    return updatedEvent;
  }
  async deleteTimelineEvent(id) {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }
  // Dashboard stats
  async getDashboardStats(userId) {
    const [{ count: totalApplications }] = await db.select({ count: count() }).from(applications).where(eq(applications.userId, userId));
    const [{ count: interviewsCount }] = await db.select({ count: count() }).from(interviews).where(eq(interviews.userId, userId));
    const [{ count: offersCount }] = await db.select({ count: count() }).from(applications).where(and(
      eq(applications.userId, userId),
      eq(applications.status, ApplicationStatus.OFFER)
    ));
    const [{ count: completedApplications }] = await db.select({ count: count() }).from(applications).where(and(
      eq(applications.userId, userId),
      eq(applications.status, ApplicationStatus.REJECTED)
    ));
    const [{ count: acceptedApplications }] = await db.select({ count: count() }).from(applications).where(and(
      eq(applications.userId, userId),
      eq(applications.status, ApplicationStatus.ACCEPTED)
    ));
    const totalCompleted = Number(completedApplications) + Number(acceptedApplications) + Number(offersCount);
    const completionRate = Number(totalApplications) > 0 ? totalCompleted / Number(totalApplications) * 100 : 0;
    const userApplications = await db.select({
      status: applications.status,
      id: applications.id,
      appliedDate: applications.appliedDate,
      company: applications.company,
      createdAt: applications.createdAt
    }).from(applications).where(eq(applications.userId, userId));
    const statusCounts = {};
    userApplications.forEach((app2) => {
      const status = app2.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([status, count2]) => ({
      status,
      count: count2
    }));
    const companyCounts = {};
    userApplications.forEach((app2) => {
      const company = app2.company || "Unknown";
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    const applicationsByCompany = Object.entries(companyCounts).map(([company, count2]) => ({ company, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
    const monthCounts = {};
    userApplications.forEach((app2) => {
      let date = null;
      if (app2.appliedDate instanceof Date) {
        date = app2.appliedDate;
      } else if (app2.appliedDate) {
        date = new Date(app2.appliedDate);
      } else if (app2.createdAt) {
        date = new Date(app2.createdAt);
      }
      if (!date) {
        return;
      }
      const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });
    const monthsOrder = {
      "Jan": 0,
      "Feb": 1,
      "Mar": 2,
      "Apr": 3,
      "May": 4,
      "Jun": 5,
      "Jul": 6,
      "Aug": 7,
      "Sep": 8,
      "Oct": 9,
      "Nov": 10,
      "Dec": 11
    };
    const applicationsByMonth = Object.entries(monthCounts).map(([month, count2]) => ({ month, count: count2 })).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ");
      const [bMonth, bYear] = b.month.split(" ");
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      return monthsOrder[aMonth] - monthsOrder[bMonth];
    });
    const [{ count: applicationsWithInterviews }] = await db.select({ count: count() }).from(applications).where(and(
      eq(applications.userId, userId),
      eq(applications.status, ApplicationStatus.INTERVIEW)
    ));
    const responseRate = Number(totalApplications) > 0 ? (Number(applicationsWithInterviews) + Number(offersCount) + Number(acceptedApplications)) / Number(totalApplications) * 100 : 0;
    let totalDaysToInterview = 0;
    let interviewsWithDates = 0;
    const interviewsWithApplications = await db.select({
      interviewDate: interviews.date,
      applicationDate: applications.appliedDate,
      applicationCreatedAt: applications.createdAt
    }).from(interviews).innerJoin(applications, eq(interviews.applicationId, applications.id)).where(eq(interviews.userId, userId));
    interviewsWithApplications.forEach((item) => {
      if (item.interviewDate) {
        const interviewDate = new Date(item.interviewDate);
        let applicationDate = null;
        if (item.applicationDate) {
          applicationDate = new Date(item.applicationDate);
        } else if (item.applicationCreatedAt) {
          applicationDate = new Date(item.applicationCreatedAt);
        }
        if (!applicationDate) {
          return;
        }
        const diffTime = Math.abs(interviewDate.getTime() - applicationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        totalDaysToInterview += diffDays;
        interviewsWithDates++;
      }
    });
    const averageDaysToInterview = interviewsWithDates > 0 ? totalDaysToInterview / interviewsWithDates : 0;
    const applicationsWithOffers = userApplications.filter(
      (app2) => app2.status === ApplicationStatus.OFFER || app2.status === ApplicationStatus.ACCEPTED
    );
    let totalDaysToOffer = 0;
    let offersWithDates = 0;
    for (const app2 of applicationsWithOffers) {
      const timelineEntries = await db.select({
        date: timelineEvents.date,
        type: timelineEvents.type
      }).from(timelineEvents).where(and(
        eq(timelineEvents.applicationId, app2.id),
        eq(timelineEvents.type, "offer")
      )).orderBy(timelineEvents.date);
      if (timelineEntries.length > 0 && timelineEntries[0].date) {
        const offerDate = new Date(timelineEntries[0].date);
        let applicationDate = null;
        if (app2.appliedDate) {
          applicationDate = new Date(app2.appliedDate);
        } else if (app2.createdAt) {
          applicationDate = new Date(app2.createdAt);
        }
        if (!applicationDate) {
          continue;
        }
        const diffTime = Math.abs(offerDate.getTime() - applicationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        totalDaysToOffer += diffDays;
        offersWithDates++;
      }
    }
    const averageDaysToOffer = offersWithDates > 0 ? totalDaysToOffer / offersWithDates : 0;
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
      averageDaysToOffer
    };
  }
  // Interview Question methods
  async getInterviewQuestionById(id) {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    return question;
  }
  async getInterviewQuestionsByUserId(userId) {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(desc(interviewQuestions.updatedAt));
  }
  async getPublicInterviewQuestions(filters, limit) {
    let conditions = [eq(interviewQuestions.public, true)];
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
    const query = db.select().from(interviewQuestions).where(and(...conditions)).orderBy(desc(interviewQuestions.upvotes));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }
  async createInterviewQuestion(question) {
    const [newQuestion] = await db.insert(interviewQuestions).values({
      ...question,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newQuestion;
  }
  async updateInterviewQuestion(id, updates) {
    const [updatedQuestion] = await db.update(interviewQuestions).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(interviewQuestions.id, id)).returning();
    return updatedQuestion;
  }
  async deleteInterviewQuestion(id) {
    await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id));
  }
  async voteInterviewQuestion(id, userId, isUpvote) {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    if (!question) {
      throw new Error("Interview question not found");
    }
    const newUpvotes = isUpvote ? (question.upvotes || 0) + 1 : question.upvotes || 0;
    const newDownvotes = !isUpvote ? (question.downvotes || 0) + 1 : question.downvotes || 0;
    const [updatedQuestion] = await db.update(interviewQuestions).set({
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(interviewQuestions.id, id)).returning();
    return updatedQuestion;
  }
  // Interview Assistance methods
  async getInterviewAssistanceById(id) {
    const [assistance] = await db.select().from(interviewAssistance).where(eq(interviewAssistance.id, id));
    return assistance;
  }
  async getInterviewAssistanceByUserId(userId) {
    return await db.select().from(interviewAssistance).where(eq(interviewAssistance.userId, userId)).orderBy(desc(interviewAssistance.createdAt));
  }
  async getInterviewAssistanceByInterviewId(interviewId) {
    const [assistance] = await db.select().from(interviewAssistance).where(eq(interviewAssistance.interviewId, interviewId));
    return assistance;
  }
  async createInterviewAssistance(assistance) {
    const [newAssistance] = await db.insert(interviewAssistance).values({
      ...assistance,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newAssistance;
  }
  async updateInterviewAssistance(id, updates) {
    const [updatedAssistance] = await db.update(interviewAssistance).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(interviewAssistance.id, id)).returning();
    return updatedAssistance;
  }
  async deleteInterviewAssistance(id) {
    await db.delete(interviewAssistance).where(eq(interviewAssistance.id, id));
  }
  async getGmailConnectionsByUserId(userId) {
    return [];
  }
  async saveGmailConnection(connection) {
    return { id: 1, ...connection };
  }
  async getStaticData() {
    const staticData2 = db.select().from(staticData2);
    return staticData2;
  }
  async createStaticData({ name, type }) {
    const [newItem] = await db.insert(staticData).values({ name, type }).returning();
    return newItem;
  }
  async deleteStaticData(id) {
    await db.delete(staticData).where(eq(staticData.id, id));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import { z } from "zod";

// server/firebase-admin.ts
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
function initializeFirebaseAdmin() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      console.error("Missing Firebase Admin credentials. Please check environment variables:");
      console.error("- FIREBASE_PROJECT_ID");
      console.error("- FIREBASE_CLIENT_EMAIL");
      console.error("- FIREBASE_PRIVATE_KEY");
      throw new Error("Missing Firebase Admin credentials");
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
    const app2 = !getApps().length ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    }) : getApp();
    return getAuth(app2);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}
var auth = initializeFirebaseAdmin();
var admin = {
  auth: () => auth
};

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function generateRandomPassword() {
  return randomBytes(16).toString("hex");
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "jams-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy({
      usernameField: "email",
      passwordField: "password"
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1)
  });
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
  });
  const firebaseAuthSchema = z.object({
    idToken: z.string(),
    email: z.string().email(),
    displayName: z.string().optional(),
    photoURL: z.string().optional()
  });
  app2.post("/api/firebase-auth", async (req, res, next) => {
    try {
      const { idToken, email, displayName, photoURL } = firebaseAuthSchema.parse(req.body);
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUID = decodedToken.uid;
        let user = await storage.getUserByEmail(email) || await storage.getUserByFirebaseUID(firebaseUID);
        if (user) {
          user = await storage.updateUser(user.id, {
            firebaseUID,
            fullName: displayName || user.fullName,
            profilePicture: photoURL || user.profilePicture,
            email
            // Update email in case it changed
          });
        } else {
          const username = email.split("@")[0] + "-" + Math.floor(Math.random() * 1e3);
          user = await storage.createUser({
            username,
            email,
            fullName: displayName || username,
            password: await hashPassword(generateRandomPassword()),
            profilePicture: photoURL || "",
            firebaseUID
          });
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      } catch (error) {
        console.error("Firebase token verification failed:", error);
        return res.status(401).json({ message: "Firebase authentication failed" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const userData = registerSchema.parse(req.body);
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const username = userData.email.split("@")[0] + "-" + Math.floor(Math.random() * 1e3);
      const user = await storage.createUser({
        ...userData,
        username,
        password: await hashPassword(userData.password)
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/team-routes.ts
import { z as z2 } from "zod";
function setupTeamRoutes(app2) {
  const requireAdminOrLeader = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userRole = req.user.role;
    if (!userRole || userRole !== UserRole.ADMIN && userRole !== UserRole.GROUP_LEADER) {
      return res.status(403).json({ message: "Access denied. Requires administrator or group leader role." });
    }
    next();
  };
  app2.get("/api/team/members", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { role, teamId } = req.user;
      let members;
      if (role === UserRole.ADMIN) {
        members = await storage.getAllUsers();
      } else if (teamId) {
        members = await storage.getUsersByTeamId(teamId);
      } else {
        return res.status(400).json({ message: "Team ID not found for group leader" });
      }
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });
  app2.get("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = parseInt(req.params.id);
      const { role, teamId } = req.user;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (role === UserRole.GROUP_LEADER && user.teamId !== teamId) {
        return res.status(403).json({ message: "Access denied. User is not in your team." });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/team/members", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { role, teamId } = req.user;
      const createUserSchema = z2.object({
        username: z2.string().min(3),
        email: z2.string().email(),
        password: z2.string().min(6),
        fullName: z2.string().optional(),
        role: z2.string(),
        teamId: z2.number().optional()
      });
      const data = createUserSchema.parse(req.body);
      if (role === UserRole.GROUP_LEADER) {
        if (data.role === UserRole.ADMIN || data.role === UserRole.GROUP_LEADER) {
          return res.status(403).json({
            message: "Group leaders cannot create administrator or group leader accounts"
          });
        }
        if (teamId) {
          data.teamId = teamId;
        } else {
          return res.status(400).json({ message: "Team ID not found for group leader" });
        }
      }
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const newUser = await storage.createUser(data);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating team member:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });
  app2.patch("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = parseInt(req.params.id);
      const user = req.user;
      const currentUserId = user.id;
      const role = user.role;
      const teamId = user.teamId;
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot modify your own account through this endpoint" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (role === UserRole.GROUP_LEADER && targetUser.teamId !== teamId) {
        return res.status(403).json({ message: "Access denied. User is not in your team." });
      }
      const updateUserSchema = z2.object({
        fullName: z2.string().optional(),
        role: z2.string().optional(),
        teamId: z2.number().optional()
      });
      const updates = updateUserSchema.parse(req.body);
      if (role === UserRole.GROUP_LEADER) {
        if (updates.role && (updates.role === UserRole.ADMIN || updates.role === UserRole.GROUP_LEADER)) {
          return res.status(403).json({
            message: "Group leaders cannot promote users to administrator or group leader roles"
          });
        }
        if (updates.teamId && updates.teamId !== teamId) {
          return res.status(403).json({
            message: "Group leaders cannot change the team assignment"
          });
        }
        if (teamId) {
          updates.teamId = teamId;
        } else {
          return res.status(400).json({ message: "Team ID not found for group leader" });
        }
      }
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating team member:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update team member" });
    }
  });
  app2.delete("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = parseInt(req.params.id);
      const user = req.user;
      const currentUserId = user.id;
      const role = user.role;
      const teamId = user.teamId;
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (role === UserRole.GROUP_LEADER) {
        if (targetUser.teamId !== teamId) {
          return res.status(403).json({ message: "Access denied. User is not in your team." });
        }
        if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.GROUP_LEADER) {
          return res.status(403).json({
            message: "Group leaders cannot delete administrator or group leader accounts"
          });
        }
      }
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });
}

// server/ai.ts
import OpenAI from "openai";
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-placeholder" });
async function generateCoverLetter(jobDescription, resumeContent, company, position) {
  try {
    const prompt = `
    I need a professional cover letter for a ${position} position at ${company}.
    
    Job Description:
    ${jobDescription}
    
    ${resumeContent ? `My Resume/CV Details:
${resumeContent}` : ""}
    
    Please write a cover letter that:
    1. Is personalized to the company and position
    2. Highlights relevant skills and experiences from my resume
    3. Aligns my background with the job requirements
    4. Has a professional tone
    5. Is formatted properly with date, address blocks, greeting, body paragraphs, closing, and signature
    6. Is approximately 300-400 words
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert cover letter writer with experience in professional job applications." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1e3
    });
    return response.choices[0].message.content || "Unable to generate cover letter. Please try again.";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please check your OpenAI API key or try again later.");
  }
}
async function analyzeResume(resumeContent, jobDescription) {
  try {
    const prompt = `
    Please analyze this resume against the job description and provide:
    1. A match score from 0-100
    2. A list of important keywords from the job description that are missing from the resume
    3. 3-5 specific suggestions to improve the resume for this job
    
    Resume Content:
    ${resumeContent}
    
    Job Description:
    ${jobDescription}
    
    Format your response as JSON with these fields:
    - matchScore: number (0-100)
    - missingKeywords: array of strings
    - suggestions: array of strings
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert resume analyzer and ATS (Applicant Tracking System) specialist." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return {
      matchScore: analysis.matchScore || 0,
      missingKeywords: analysis.missingKeywords || [],
      suggestions: analysis.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume. Please check your OpenAI API key or try again later.");
  }
}
async function generateInterviewQuestions(jobDescription, position, company) {
  try {
    const prompt = `
    Generate 10 likely interview questions for a ${position} position at ${company}.
    
    Job Description:
    ${jobDescription}
    
    Create a mix of:
    - Technical/skill-based questions
    - Behavioral questions
    - Company-specific questions
    - Role-specific questions
    
    Format your response as a JSON array of strings, with each string being a complete interview question.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert in technical and behavioral interviewing for tech companies." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    const questions = JSON.parse(response.choices[0].message.content || "{}");
    return questions.questions || [];
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions. Please check your OpenAI API key or try again later.");
  }
}
async function generateResponseToQuestion(question, resumeContent, framework = "STAR", keywords = [], tone = "professional") {
  try {
    const prompt = `
    Help me answer this interview question: "${question}"
    
    My resume details:
    ${resumeContent}
    
    Please structure the answer using the ${framework} framework.
    
    Include these keywords if relevant: ${keywords.join(", ")}
    
    Use a ${tone} tone.
    
    The answer should be concise (approximately 250 words) and highlight relevant experience from my resume.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach who helps job candidates prepare compelling answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content || "Unable to generate response. Please try again.";
  } catch (error) {
    console.error("Error generating interview response:", error);
    throw new Error("Failed to generate interview response. Please check your OpenAI API key or try again later.");
  }
}
async function analyzeInterviewTranscript(transcript, jobDescription, position) {
  try {
    const prompt = `
    Analyze this interview transcript for a ${position} position and provide feedback:
    
    Transcript:
    ${transcript}
    
    Job Description:
    ${jobDescription}
    
    Please analyze the interview responses for:
    1. Communication skills (clarity, conciseness, confidence)
    2. Technical accuracy and depth of answers
    3. Relevance to the position and job description
    4. Overall impression
    
    Provide a JSON response with:
    - feedback: an object containing:
      - strengths: array of 2-4 key strengths demonstrated
      - weaknesses: array of 2-4 areas for improvement
      - overallScore: number from 1-10
      - communication: number from 1-10
      - technicalAccuracy: number from 1-10  
      - relevance: number from 1-10
    - suggestions: array of 3-5 specific suggestions for improvement
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach and feedback specialist." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return {
      feedback: {
        strengths: analysis.feedback?.strengths || [],
        weaknesses: analysis.feedback?.weaknesses || [],
        overallScore: analysis.feedback?.overallScore || 0,
        communication: analysis.feedback?.communication || 0,
        technicalAccuracy: analysis.feedback?.technicalAccuracy || 0,
        relevance: analysis.feedback?.relevance || 0
      },
      suggestions: analysis.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing interview transcript:", error);
    throw new Error("Failed to analyze interview. Please check your OpenAI API key or try again later.");
  }
}
async function generateInterviewFeedback(questions, answers, position) {
  try {
    const qaContext = questions.map((q, i) => `Q${i + 1}: ${q}
A${i + 1}: ${answers[i] || "No answer provided"}`).join("\n\n");
    const prompt = `
    Analyze these interview questions and answers for a ${position} position and provide detailed feedback:
    
    ${qaContext}
    
    Provide a JSON response with:
    1. questionFeedback: an array of objects, each containing:
       - questionId: the 1-based index of the question
       - rating: a score from 1-10
       - feedback: a brief assessment of what was good or needed improvement
       - improvementSuggestion: specific advice on how to improve the answer
    
    2. overallFeedback: an object containing:
       - strengths: an array of 2-3 key strengths demonstrated across all answers
       - areasForImprovement: an array of 2-3 key areas for improvement
       - overallRating: a score from 1-10 representing overall interview performance
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach specializing in providing constructive feedback." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    const feedback = JSON.parse(response.choices[0].message.content || "{}");
    return {
      questionFeedback: feedback.questionFeedback || [],
      overallFeedback: {
        strengths: feedback.overallFeedback?.strengths || [],
        areasForImprovement: feedback.overallFeedback?.areasForImprovement || [],
        overallRating: feedback.overallFeedback?.overallRating || 0
      }
    };
  } catch (error) {
    console.error("Error generating interview feedback:", error);
    throw new Error("Failed to generate feedback. Please check your OpenAI API key or try again later.");
  }
}
async function createMockInterview(position, company, level = "intermediate", focusAreas = []) {
  try {
    const prompt = `
    Create a mock interview for a ${position} position at ${company}.
    Experience level: ${level}
    ${focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(", ")}` : ""}
    
    Generate 8 interview questions that would be likely asked in this scenario.
    
    For each question, provide:
    1. question: The full interview question
    2. questionType: The category (technical, behavioral, situational, company-specific)
    3. difficulty: A rating (easy, medium, hard)
    4. expectedTopics: Array of 2-4 key topics/concepts the answer should address
    
    Format as a JSON with a "questions" array containing these question objects.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert technical interviewer who specializes in creating realistic interview scenarios." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    const mockInterview = JSON.parse(response.choices[0].message.content || "{}");
    const questions = (mockInterview.questions || []).map((q, index) => ({
      id: index + 1,
      ...q
    }));
    return { questions };
  } catch (error) {
    console.error("Error creating mock interview:", error);
    throw new Error("Failed to create mock interview. Please check your OpenAI API key or try again later.");
  }
}
async function analyzeApplicationStatus(application, statusHistory) {
  try {
    const appliedDate = application.appliedDate ? application.appliedDate instanceof Date ? application.appliedDate.toISOString() : new Date(application.appliedDate).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const historyContext = statusHistory && statusHistory.length > 0 ? `Status History:
${statusHistory.map((h) => {
      const dateStr = h.date ? h.date instanceof Date ? h.date.toISOString() : new Date(h.date).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
      return `- ${h.status} (${dateStr})`;
    }).join("\n")}` : "";
    const prompt = `
    Analyze this job application and provide an optimized color scheme and visual cues:
    
    Company: ${application.company}
    Position: ${application.position}
    Current Status: ${application.status}
    Applied Date: ${appliedDate}
    Description: ${application.description || "N/A"}
    Notes: ${application.notes || "N/A"}
    ${historyContext}
    
    Today's date: ${(/* @__PURE__ */ new Date()).toISOString()}
    
    Based on this information, provide a color scheme and visual representation that:
    1. Represents the current status emotionally and informationally
    2. Takes into account the time elapsed since application/last status change
    3. Creates an intuitive visual representation of the application's progress
    
    Provide a JSON response with:
    - backgroundColor: A hex color code for the background (must be dark and suitable for a dark theme)
    - textColor: A hex color code for the text that will be visible on the background
    - borderColor: A hex color code for the border
    - intensity: A number from 0-100 representing visual intensity/urgency
    - visualCues: An object with:
        - icon: A suggested icon name from the Lucide React icon set (optional)
        - description: A brief explanation of the visual representation
    - explanation: A detailed explanation of why these colors were chosen
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert UI/UX designer specializing in data visualization and color psychology for job application tracking systems."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });
    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return {
      backgroundColor: analysis.backgroundColor || "#293141",
      textColor: analysis.textColor || "#ffffff",
      borderColor: analysis.borderColor || "#3e4a61",
      intensity: analysis.intensity || 50,
      visualCues: {
        icon: analysis.visualCues?.icon || void 0,
        description: analysis.visualCues?.description || "Standard application status"
      },
      explanation: analysis.explanation || "Default color scheme applied"
    };
  } catch (error) {
    console.error("Error analyzing application status:", error);
    throw new Error("Failed to analyze application status. Please check your OpenAI API key or try again later.");
  }
}

// server/routes.ts
import { z as z4 } from "zod";

// server/gmail-service.ts
import { google } from "googleapis";
var GmailService = class {
  oauth2Client;
  constructor() {
    const domain = process.env.REPL_SLUG && process.env.REPL_OWNER ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : process.env.REPL_ID ? `${process.env.REPL_ID}.id.repl.co` : process.env.APP_URL?.replace("https://", "");
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://${domain}/api/gmail/oauth/callback`
    );
  }
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
      ],
      prompt: "consent"
    });
  }
  async createCalendarEvent(connection, event) {
    try {
      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      const calendarEvent = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: event.location
        }
      });
      return calendarEvent.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }
  async handleCallback(code, userId) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    await storage.saveGmailConnection({
      userId,
      email: profile.data.emailAddress,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry: new Date(tokens.expiry_date)
    });
  }
  async getEmails(connection) {
    try {
      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });
      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        q: "in:inbox"
      });
      if (!response.data.messages) {
        return [];
      }
      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const fullMessage = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full"
          });
          const headers = fullMessage.data.payload?.headers;
          const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject";
          const from = headers?.find((h) => h.name === "From")?.value || "";
          const to = headers?.find((h) => h.name === "To")?.value || "";
          const date = new Date(parseInt(fullMessage.data.internalDate));
          let body = "";
          if (fullMessage.data.payload?.body?.data) {
            body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString();
          }
          return {
            id: message.id,
            subject,
            from,
            to,
            date,
            body,
            snippet: fullMessage.data.snippet || ""
          };
        })
      );
      return emails;
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  }
};
var gmailService = new GmailService();

// server/job-platforms.ts
import fetch2 from "node-fetch";

// client/src/config/job-platforms.ts
import { z as z3 } from "zod";
var jobPlatformSchema = z3.object({
  id: z3.string(),
  name: z3.string(),
  baseUrl: z3.string(),
  apiKeyRequired: z3.boolean(),
  apiKeyName: z3.string().optional(),
  searchParams: z3.array(
    z3.object({
      name: z3.string(),
      label: z3.string(),
      type: z3.string(),
      required: z3.boolean(),
      options: z3.array(z3.string()).optional()
    })
  )
});
var JOB_PLATFORMS = [
  {
    id: "remoteok",
    name: "RemoteOK",
    baseUrl: "https://remoteok.io/api",
    apiKeyRequired: false,
    searchParams: [
      { name: "search", label: "Search", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false }
    ]
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    baseUrl: "https://www.arbeitnow.com/api/job-board-api",
    apiKeyRequired: false,
    searchParams: [
      { name: "search", label: "Search", type: "text", required: true },
      { name: "category", label: "Category", type: "text", required: false }
    ]
  },
  {
    id: "openskills",
    name: "OpenSkills",
    baseUrl: "https://api.openskills.co/v1/jobs",
    apiKeyRequired: true,
    apiKeyName: "OPENSKILLS_API_KEY",
    searchParams: [
      { name: "search", label: "Keywords", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false }
    ]
  },
  {
    id: "adzuna",
    name: "Adzuna",
    baseUrl: "https://api.adzuna.com/v1/api/jobs",
    apiKeyRequired: true,
    apiKeyName: "ADZUNA_API_KEY",
    searchParams: [
      { name: "what", label: "Keywords", type: "text", required: true },
      { name: "where", label: "Location", type: "text", required: false },
      {
        name: "country",
        label: "Country",
        type: "select",
        required: true,
        options: ["us", "uk", "au", "de", "fr"]
      }
    ]
  },
  {
    id: "remotive",
    name: "Remotive",
    baseUrl: "https://remotive.com/api/remote-jobs",
    apiKeyRequired: false,
    searchParams: [
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["software-dev", "customer-service", "design", "marketing", "sales", "product"]
      },
      {
        name: "company_name",
        label: "Company",
        type: "text"
      },
      {
        name: "search",
        label: "Search",
        type: "text"
      },
      {
        name: "limit",
        label: "Limit Results",
        type: "text"
      }
    ]
  },
  {
    id: "usajobs",
    name: "USAJobs",
    baseUrl: "https://data.usajobs.gov/api/search",
    apiKeyRequired: true,
    apiKeyName: "USAJOBS_API_KEY",
    searchParams: [
      { name: "keyword", label: "Keywords", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false },
      {
        name: "grade",
        label: "Grade Level",
        type: "select",
        required: false,
        options: ["5", "7", "9", "11", "12", "13", "14", "15"]
      }
    ]
  }
];

// server/job-platforms.ts
async function searchJobs(platform, params) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (platform.apiKeyRequired && platform.apiKeyName) {
    const apiKey = process.env[platform.apiKeyName];
    if (!apiKey) {
      throw new Error(`API key not found for ${platform.name}`);
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  const queryParams = new URLSearchParams(params);
  const response = await fetch2(`${platform.baseUrl}`);
  console.log(
    `Fetching jobs from ${platform.name} with params: ${queryParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs from ${platform.name}`);
  }
  const data = await response.json();
  return normalizeJobData(platform.id, data);
}
function normalizeJobData(platformId, data) {
  switch (platformId) {
    case "remotive":
      return data.jobs.map((job) => ({
        id: job.id.toString(),
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Remote",
        url: job.url,
        salary: job.salary,
        jobType: job.job_type,
        publicationDate: job.publication_date,
        description: job.description,
        platform: "Remotive"
      }));
    case "remoteok":
      return data.map((job) => ({
        id: job.id,
        title: job.position,
        company: job.company,
        location: job.location || "Remote",
        salary: job.salary || "Not specified",
        url: job.url,
        jobType: job.job_type,
        companyLogo: job.company_logo,
        description: job.description,
        platform: "RemoteOK"
      }));
    case "arbeitnow":
      return data.data.map((job) => ({
        id: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.location || "Remote",
        salary: job.salary || "Not specified",
        url: job.url,
        jobType: job.job_type,
        companyLogo: job.company_logo,
        description: job.description,
        platform: "Arbeitnow"
      }));
    case "openskills":
      return data.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company.name,
        location: job.location,
        salary: job.salary_range || "Not specified",
        url: job.url,
        jobType: job.employment_type,
        companyLogo: job.company.logo_url,
        description: job.description,
        platform: "OpenSkills"
      }));
    case "adzuna":
      return data.results.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        salary: job.salary_min ? `${job.salary_min}-${job.salary_max}` : "Not specified",
        url: job.redirect_url,
        platform: "Adzuna"
      }));
    case "remotive":
      return data.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location,
        salary: job.salary || "Not specified",
        url: job.url,
        platform: "Remotive"
      }));
    case "usajobs":
      return data.SearchResult.SearchResultItems.map((job) => ({
        id: job.MatchedObjectId,
        title: job.MatchedObjectDescriptor.PositionTitle,
        company: job.MatchedObjectDescriptor.DepartmentName,
        location: job.MatchedObjectDescriptor.PositionLocationDisplay,
        salary: `${job.MatchedObjectDescriptor.PositionRemuneration[0].MinimumRange}-${job.MatchedObjectDescriptor.PositionRemuneration[0].MaximumRange}`,
        url: job.MatchedObjectDescriptor.PositionURI,
        platform: "USAJobs"
      }));
    default:
      return [];
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  setupTeamRoutes(app2);
  app2.get("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "updatedAt";
    const sortOrder = (req.query.sortOrder || "desc").toLowerCase();
    const offset = (page - 1) * limit;
    try {
      const [applications2, total] = await Promise.all([
        storage.getApplicationsByUserIdPaginated(
          req.user.id,
          limit,
          offset,
          status,
          search,
          sortBy,
          sortOrder
        ),
        storage.getApplicationsCountByUserId(req.user.id, status, search)
      ]);
      res.json({
        applications: applications2,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total,
        itemsPerPage: limit
      });
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });
  app2.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user.id };
      const validatedData = insertApplicationSchema.parse(userData);
      const application = await storage.createApplication(validatedData);
      await storage.createTimelineEvent({
        applicationId: application.id,
        userId: req.user.id,
        title: "Application Submitted",
        description: `Applied for ${application.position} at ${application.company}`,
        type: "application"
      });
      res.status(201).json(application);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });
  app2.get("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(application);
  });
  app2.patch("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    try {
      const updatedApplication = await storage.updateApplication(
        applicationId,
        req.body
      );
      if (req.body.status && req.body.status !== application.status) {
        let eventTitle = "Status Updated";
        let eventType = "note";
        if (req.body.status === ApplicationStatus.INTERVIEW) {
          eventTitle = "Interview Stage";
          eventType = "interview";
        } else if (req.body.status === ApplicationStatus.OFFER) {
          eventTitle = "Received Offer";
          eventType = "offer";
        } else if (req.body.status === ApplicationStatus.REJECTED) {
          eventTitle = "Application Rejected";
          eventType = "rejection";
        }
        await storage.createTimelineEvent({
          applicationId,
          userId: req.user.id,
          title: eventTitle,
          description: `Status changed from ${application.status} to ${req.body.status}`,
          type: eventType
        });
      }
      res.json(updatedApplication);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.delete("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    await storage.deleteApplication(applicationId);
    res.status(204).send();
  });
  app2.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const type = req.query.type;
    const documents2 = await storage.getDocumentsByUserId(req.user.id, type);
    res.json(documents2);
  });
  app2.post("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user.id };
      const validatedData = insertDocumentSchema.parse(userData);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user.id) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  });
  app2.patch("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user.id) {
      return res.status(404).json({ error: "Document not found" });
    }
    try {
      let version = document.version;
      if (req.body.content && req.body.content !== document.content) {
        version += 1;
      }
      const updatedData = { ...req.body, version, updatedAt: /* @__PURE__ */ new Date() };
      const updatedDocument = await storage.updateDocument(
        documentId,
        updatedData
      );
      res.json(updatedDocument);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user.id) {
      return res.status(404).json({ error: "Document not found" });
    }
    await storage.deleteDocument(documentId);
    res.status(204).send();
  });
  app2.get("/api/interviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const interviews2 = await storage.getInterviewsByUserId(req.user.id);
    res.json(interviews2);
  });
  app2.post("/api/interviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user.id };
      const validatedData = insertInterviewSchema.parse(userData);
      const application = await storage.getApplicationById(
        validatedData.applicationId
      );
      if (!application || application.userId !== req.user.id) {
        return res.status(404).json({ error: "Application not found" });
      }
      const interview = await storage.createInterview(validatedData);
      await storage.createTimelineEvent({
        applicationId: validatedData.applicationId,
        userId: req.user.id,
        title: "Interview Scheduled",
        description: `${interview.type} interview scheduled for ${interview.title} at ${interview.company}`,
        type: "interview"
      });
      res.status(201).json(interview);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/applications/:id/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    const contacts2 = await storage.getContactsByApplicationId(applicationId);
    res.json(contacts2);
  });
  app2.post("/api/applications/:id/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    try {
      const userData = { ...req.body, applicationId, userId: req.user.id };
      const validatedData = insertContactSchema.parse(userData);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/applications/:id/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    const timeline = await storage.getTimelineEventsByApplicationId(applicationId);
    res.json(timeline);
  });
  app2.post("/api/applications/:id/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }
    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    try {
      const userData = { ...req.body, applicationId, userId: req.user.id };
      const validatedData = insertTimelineEventSchema.parse(userData);
      const event = await storage.createTimelineEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const stats = await storage.getDashboardStats(req.user.id);
    res.json(stats);
  });
  app2.post("/api/ai/cover-letter", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      jobDescription: z4.string(),
      resumeId: z4.number().optional(),
      company: z4.string(),
      position: z4.string()
    });
    try {
      const { jobDescription, resumeId, company, position } = schema.parse(
        req.body
      );
      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (resume && resume.userId === req.user.id && resume.type === DocumentType.RESUME) {
          resumeContent = resume.content;
        }
      }
      const coverLetter = await generateCoverLetter(
        jobDescription,
        resumeContent,
        company,
        position
      );
      res.json({ coverLetter });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/resume-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      resumeId: z4.number(),
      jobDescription: z4.string()
    });
    try {
      const { resumeId, jobDescription } = schema.parse(req.body);
      const resume = await storage.getDocumentById(resumeId);
      if (!resume || resume.userId !== req.user.id || resume.type !== DocumentType.RESUME) {
        return res.status(404).json({ error: "Resume not found" });
      }
      const analysis = await analyzeResume(resume.content, jobDescription);
      res.json({ analysis });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/application-status-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      applicationId: z4.number()
    });
    try {
      const { applicationId } = schema.parse(req.body);
      const application = await storage.getApplicationById(applicationId);
      if (!application || application.userId !== req.user.id) {
        return res.status(404).json({ error: "Application not found" });
      }
      const timelineEvents2 = await storage.getTimelineEventsByApplicationId(applicationId);
      const statusHistory = timelineEvents2.filter(
        (event) => event.title.includes("Status") || event.type === "application" || event.type === "interview" || event.type === "offer" || event.type === "rejection"
      ).map((event) => ({
        status: event.title.includes("Status") ? event.description.split("to ")[1] : event.type === "application" ? "applied" : event.type === "interview" ? "interview" : event.type === "offer" ? "offer" : event.type === "rejection" ? "rejected" : "unknown",
        date: event.date
      }));
      const safeApplication = {
        company: application.company,
        position: application.position,
        status: application.status,
        appliedDate: application.appliedDate,
        notes: application.notes,
        description: application.description
      };
      const colorAnalysis = await analyzeApplicationStatus(
        safeApplication,
        statusHistory
      );
      res.json({ colorAnalysis });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });
  app2.get("/api/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const questions = await storage.getInterviewQuestionsByUserId(req.user.id);
    res.json(questions);
  });
  app2.get("/api/interview-questions/public", async (req, res) => {
    const filters = {
      company: req.query.company,
      role: req.query.role,
      category: req.query.category,
      difficulty: req.query.difficulty
    };
    const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
    const questions = await storage.getPublicInterviewQuestions(filters, limit);
    res.json(questions);
  });
  app2.post("/api/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user.id };
      const validatedData = insertInterviewQuestionSchema.parse(userData);
      const question = await storage.createInterviewQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/interview-questions/:id/vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const questionId = parseInt(req.params.id);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }
    const schema = z4.object({
      isUpvote: z4.boolean()
    });
    try {
      const { isUpvote } = schema.parse(req.body);
      const updatedQuestion = await storage.voteInterviewQuestion(
        questionId,
        req.user.id,
        isUpvote
      );
      res.json(updatedQuestion);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assistances = await storage.getInterviewAssistanceByUserId(
      req.user.id
    );
    res.json(assistances);
  });
  app2.post("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user.id };
      const validatedData = insertInterviewAssistanceSchema.parse(userData);
      if (validatedData.interviewId) {
        const interview = await storage.getInterviewById(
          validatedData.interviewId
        );
        if (!interview || interview.userId !== req.user.id) {
          return res.status(404).json({ error: "Interview not found" });
        }
      }
      const assistance = await storage.createInterviewAssistance(validatedData);
      res.status(201).json(assistance);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      jobDescription: z4.string(),
      position: z4.string(),
      company: z4.string()
    });
    try {
      const { jobDescription, position, company } = schema.parse(req.body);
      const questions = await generateInterviewQuestions(
        jobDescription,
        position,
        company
      );
      res.json({ questions });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/interview-answer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      question: z4.string(),
      resumeId: z4.number().optional(),
      framework: z4.string().optional(),
      keywords: z4.array(z4.string()).optional(),
      tone: z4.string().optional()
    });
    try {
      const { question, resumeId, framework, keywords, tone } = schema.parse(
        req.body
      );
      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (resume && resume.userId === req.user.id && resume.type === DocumentType.RESUME) {
          resumeContent = resume.content;
        }
      }
      const answer = await generateResponseToQuestion(
        question,
        resumeContent,
        framework,
        keywords,
        tone
      );
      res.json({ answer });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/interview-feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      questions: z4.array(z4.string()),
      answers: z4.array(z4.string()),
      position: z4.string()
    });
    try {
      const { questions, answers, position } = schema.parse(req.body);
      const feedback = await generateInterviewFeedback(
        questions,
        answers,
        position
      );
      res.json({ feedback });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/mock-interview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      position: z4.string(),
      company: z4.string(),
      level: z4.string().optional(),
      focusAreas: z4.array(z4.string()).optional()
    });
    try {
      const { position, company, level, focusAreas } = schema.parse(req.body);
      const mockInterview = await createMockInterview(
        position,
        company,
        level,
        focusAreas
      );
      res.json(mockInterview);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/ai/interview-transcript-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z4.object({
      transcript: z4.string(),
      jobDescription: z4.string(),
      position: z4.string()
    });
    try {
      const { transcript, jobDescription, position } = schema.parse(req.body);
      const analysis = await analyzeInterviewTranscript(
        transcript,
        jobDescription,
        position
      );
      res.json({ analysis });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.get("/api/gmail/auth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const authUrl = gmailService.getAuthUrl();
    res.json({ authUrl });
  });
  app2.get("/api/gmail/oauth/callback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "No authorization code provided" });
    }
    try {
      await gmailService.handleCallback(code, req.user.id);
      res.redirect("/email");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Failed to complete OAuth flow" });
    }
  });
  app2.post("/api/calendar/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const connections = await storage.getGmailConnectionsByUserId(
        req.user.id
      );
      if (!connections || connections.length === 0) {
        return res.status(404).json({ error: "No Google account connected" });
      }
      const event = await gmailService.createCalendarEvent(
        connections[0],
        req.body
      );
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/interviews/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const interviewId = parseInt(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ error: "Invalid interview ID" });
    }
    try {
      const interview = await storage.getInterviewById(interviewId);
      if (!interview || interview.userId !== req.user.id) {
        return res.status(404).json({ error: "Interview not found" });
      }
      const videoUrl = req.file ? `/uploads/${req.file.filename}` : void 0;
      const feedback = await storage.createInterviewFeedback({
        interviewId,
        userId: req.user.id,
        comments: req.body.comments,
        videoUrl,
        tags: JSON.parse(req.body.tags)
      });
      res.status(201).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });
  app2.post("/api/jobs/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { platform: platformId, params } = req.body;
      const platform = JOB_PLATFORMS.find((p) => p.id === platformId);
      if (!platform) {
        return res.status(400).json({ error: "Invalid platform" });
      }
      const jobs = await searchJobs(platform, params);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events", async (req, res) => {
    const { title, description, date } = req.body;
    try {
      const newEvent = {
        title,
        description,
        date: new Date(date)
        // Ensure to handle the Date correctly
      };
      await db.createTimelineEvent(newEvent);
      res.status(201).send({ message: "Event created successfully!" });
    } catch (error) {
      console.error("Error saving event:", error);
      res.status(500).send({ error: "Failed to create event." });
    }
  });
  app2.get("/api/gmail/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const connections = await storage.getGmailConnectionsByUserId(
        req.user.id
      );
      if (!connections || connections.length === 0) {
        return res.status(404).json({ error: "No Gmail accounts connected" });
      }
      const allEmails = await Promise.all(
        connections.map((connection) => gmailService.getEmails(connection))
      );
      const emails = allEmails.flat().sort((a, b) => b.date.getTime() - a.date.getTime());
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/applications/import", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const match = url.match(/\/d\/(.*?)\/|$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid Google Sheets URL" });
      }
      const sheetId = match[1];
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
      );
      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch sheet data" });
      }
      const text2 = await response.text();
      const rows = text2.split("\n").map((row) => row.split(","));
      const validApplications = [];
      const existingApplications = await storage.getApplicationsByUserId(
        req.user.id
      );
      for (const row of rows.slice(1)) {
        const { columnMapping } = req.body;
        const date = row[columnMapping.date]?.replace(/['"]+/g, "");
        const skills = row[columnMapping.skills]?.replace(/['"]+/g, "").split(",").map((s) => s.trim());
        const company = row[columnMapping.company]?.replace(/['"]+/g, "");
        const position = row[columnMapping.position]?.replace(/['"]+/g, "");
        const url2 = row[columnMapping.url]?.replace(/['"]+/g, "");
        const profile = row[columnMapping.profile]?.replace(/['"]+/g, "");
        if (!company || !position) continue;
        const isDuplicate = existingApplications.some(
          (app3) => app3.company.toLowerCase() === company.toLowerCase() && app3.position.toLowerCase() === position.toLowerCase()
        );
        if (!isDuplicate) {
          validApplications.push({
            company,
            position,
            url: url2,
            notes: `Skills: ${skills.join(", ")}
Profile: ${row[6]?.replace(/['"]+/g, "")}`,
            appliedDate: date ? new Date(date) : /* @__PURE__ */ new Date(),
            status: "applied",
            userId: req.user.id
          });
        }
      }
      const batchSize = 5;
      const createdApplications = [];
      for (let i = 0; i < validApplications.length; i += batchSize) {
        const batch = validApplications.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((app3) => storage.createApplication(app3))
        );
        createdApplications.push(...results);
      }
      res.json({
        count: createdApplications.length,
        skipped: rows.length - 1 - validApplications.length
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import applications" });
    }
  });
  app2.delete("/api/applications/cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const result = await storage.cleanupApplications(req.user.id);
      res.json({ removedCount: result });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup applications" });
    }
  });
  app2.get("/api/applications/others", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const position = req.query.position;
    if (!position) {
      return res.status(400).json({ error: "Position is required" });
    }
    try {
      const otherApplicants = await storage.getOtherApplicantsByPosition(
        req.user.id,
        position
      );
      res.json(otherApplicants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch other applicants" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/migrations.ts
async function createTables() {
  try {
    await db.execute(
      /* sql */
      `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT,
        profile_picture TEXT,
        firebase_uid TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'job_seeker',
        team_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied',
        url TEXT,
        description TEXT,
        notes TEXT,
        job_type TEXT,
        company_logo TEXT,
        salary TEXT,
        remote_type TEXT,
        location TEXT,
        job_source TEXT,
        platform TEXT,
        platform_job_id TEXT,
        source_identifier TEXT UNIQUE,
        publication_date TIMESTAMP,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DROP TABLE IF EXISTS interviews;
      CREATE TABLE interviews (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        type TEXT NOT NULL,
        date TIMESTAMP,
        duration INTEGER,
        location TEXT,
        notes TEXT,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        completed BOOLEAN DEFAULT false,
        feedback TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS timeline_events (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    );
    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error creating database tables:", error);
    throw error;
  }
}

// server/index.ts
var app = express2();
app.use(express2.json());
createTables().catch(console.error);
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
