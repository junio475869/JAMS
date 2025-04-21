import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles Enum
export const UserRole = {
  ADMIN: "admin",
  GROUP_LEADER: "group_leader",
  JOB_SEEKER: "job_seeker",
  JOB_BIDDER: "job_bidder",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profilePicture: text("profile_picture"),
  firebaseUID: text("firebase_uid").unique(),
  role: text("role").notNull().default(UserRole.JOB_SEEKER),
  teamId: integer("team_id"), // For group members to be associated with a team
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  profilePicture: true,
  firebaseUID: true,
  role: true,
  teamId: true,
});

// Applications
export const applications = pgTable("applications", {
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

export const insertApplicationSchema = createInsertSchema(applications).pick({
  userId: true,
  company: true,
  position: true,
  status: true,
  url: true,
  description: true,
  notes: true,
  appliedDate: true,
}).extend({
  interviewSteps: z.array(z.object({
    id: z.number(),
    stepName: z.string(),
    sequence: z.number(),
    completed: z.boolean(),
    scheduledDate: z.date().optional(),
    interviewerName: z.string().optional(),
    interviewerLinkedIn: z.string().optional(),
    meetingUrl: z.string().optional(),
    duration: z.number().optional(),
    comments: z.string().optional(),
    feedback: z.string().optional()
  })).optional()
});

// Interviews
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(), // 'phone', 'technical', 'onsite', 'hr', 'panel'
  date: timestamp("date"),
  duration: integer("duration"), // in minutes
  location: text("location"),
  notes: text("notes"),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  completed: boolean("completed").default(false),
  feedback: text("feedback").default(''),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'resume', 'cover_letter'
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  name: true,
  type: true,
  content: true,
  version: true,
});

// Interview Steps
export const interviewSteps = pgTable("interview_steps", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  stepName: text("step_name").notNull(),
  sequence: integer("sequence").notNull(),
  interviewerName: text("interviewer_name"),
  interviewerLinkedIn: text("interviewer_linkedin"),
  meetingUrl: text("meeting_url"),
  scheduledDate: timestamp("scheduled_date"),
  duration: integer("duration"), // minutes
  comments: text("comments"),
  feedback: text("feedback"),
  interviewer: integer("interviewer").references(() => users.id),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertInterviewStepSchema = createInsertSchema(interviewSteps);

export type InterviewStep = typeof interviewSteps.$inferSelect;
export type InsertInterviewStep = z.infer<typeof insertInterviewStepSchema>;

export const insertInterviewSchema = createInsertSchema(interviews).pick({
  applicationId: true,
  userId: true,
  title: true,
  company: true,
  type: true,
  date: true,
  duration: true,
  location: true,
  notes: true,
});

// Contacts
export const contacts = pgTable("contacts", {
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

export const insertContactSchema = createInsertSchema(contacts).pick({
  applicationId: true,
  userId: true,
  name: true,
  title: true,
  email: true,
  phone: true,
  notes: true,
});

// Timeline events
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  type: text("type").notNull(), // 'application', 'interview', 'offer', 'rejection', 'note'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).pick({
  applicationId: true,
  userId: true,
  title: true,
  description: true,
  date: true,
  type: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

// Application status enum
export const ApplicationStatus = {
  APPLIED: "applied",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
  ACCEPTED: "accepted"
} as const;

export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus];

// Document type enum
export const DocumentType = {
  RESUME: "resume",
  COVER_LETTER: "cover_letter"
} as const;

export type DocumentTypeType = typeof DocumentType[keyof typeof DocumentType];

// Interview type enum
export const InterviewType = {
  PHONE: "phone",
  TECHNICAL: "technical",
  ONSITE: "onsite",
  HR: "hr",
  PANEL: "panel"
} as const;

export type InterviewTypeType = typeof InterviewType[keyof typeof InterviewType];

// Interview Feedback
export const interviewFeedback = pgTable("interview_feedback", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comments: text("comments").notNull(),
  videoUrl: text("video_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).pick({
  interviewId: true,
  userId: true,
  comments: true,
  videoUrl: true,
  tags: true
});

export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = z.infer<typeof insertInterviewFeedbackSchema>;

// Interview Questions
export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  company: text("company").notNull(),
  role: text("role").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  category: text("category").notNull(), // "behavioral", "technical", "situational", "company", "other"
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  aiGenerated: boolean("ai_generated").default(false),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  public: boolean("public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).pick({
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

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;

// Interview Question Category enum
export const InterviewQuestionCategory = {
  BEHAVIORAL: "behavioral",
  TECHNICAL: "technical",
  SITUATIONAL: "situational",
  COMPANY: "company",
  OTHER: "other"
} as const;

export type InterviewQuestionCategoryType = typeof InterviewQuestionCategory[keyof typeof InterviewQuestionCategory];

// Interview Question Difficulty enum
export const InterviewQuestionDifficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard"
} as const;

export type InterviewQuestionDifficultyType = typeof InterviewQuestionDifficulty[keyof typeof InterviewQuestionDifficulty];

// Interview Assistance
export const interviewAssistance = pgTable("interview_assistance", {
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

export const insertInterviewAssistanceSchema = createInsertSchema(interviewAssistance).pick({
  userId: true,
  interviewId: true,
  transcriptText: true,
  questions: true,
  responses: true,
  feedback: true
});

export type InterviewAssistance = typeof interviewAssistance.$inferSelect;
export type InsertInterviewAssistance = z.infer<typeof insertInterviewAssistanceSchema>;

// Job Profiles
export const jobProfiles = pgTable("job_profiles", {
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

export const insertJobProfileSchema = createInsertSchema(jobProfiles).pick({
  userId: true,
  name: true,
  title: true,
  summary: true,
  skills: true,
  experience: true,
  education: true,
  defaultResume: true,
  defaultCoverLetter: true,
});

export type JobProfile = typeof jobProfiles.$inferSelect;
export type InsertJobProfile = z.infer<typeof insertJobProfileSchema>;

// Chat Channels
export const chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'direct', 'group', 'channel'
  createdBy: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertChatChannelSchema = createInsertSchema(chatChannels).pick({
  name: true,
  type: true,
  createdBy: true,
  isPrivate: true,
});

// Chat Channel Members
export const chatChannelMembers = pgTable("chat_channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member").notNull(), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastRead: timestamp("last_read").defaultNow(),
});

export const insertChatChannelMemberSchema = createInsertSchema(chatChannelMembers).pick({
  channelId: true,
  userId: true,
  role: true,
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),
  type: text("type").default("text").notNull(), // 'text', 'image', 'file', 'voice', 'video'
  attachmentUrl: text("attachment_url"),
  reactions: jsonb("reactions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isDeleted: boolean("is_deleted").default(false),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  channelId: true,
  userId: true,
  content: true,
  type: true,
  attachmentUrl: true,
  reactions: true,
});

// Define types for chat
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;

export type ChatChannelMember = typeof chatChannelMembers.$inferSelect;
export type InsertChatChannelMember = z.infer<typeof insertChatChannelMemberSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Chat types
export const ChatChannelType = {
  DIRECT: "direct",
  GROUP: "group",
  CHANNEL: "channel"
} as const;

export type ChatChannelTypeType = typeof ChatChannelType[keyof typeof ChatChannelType];

export const ChatMemberRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member"
} as const;

export type ChatMemberRoleType = typeof ChatMemberRole[keyof typeof ChatMemberRole];

export const ChatMessageType = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  VOICE: "voice",
  VIDEO: "video"
} as const;

export type ChatMessageTypeType = typeof ChatMessageType[keyof typeof ChatMessageType];

// Sheet Import Settings
export const sheetImportSettings = pgTable("sheet_import_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  sheetUrl: text("sheet_url").notNull(),
  columnMapping: jsonb("column_mapping").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertSheetImportSettingsSchema = createInsertSchema(sheetImportSettings);
export type SheetImportSettings = typeof sheetImportSettings.$inferSelect;
export type InsertSheetImportSettings = z.infer<typeof insertSheetImportSettingsSchema>;


// Gmail Connections
export const gmailConnections = pgTable("gmail_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiry: timestamp("expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertGmailConnectionSchema = createInsertSchema(gmailConnections);
export type GmailConnection = typeof gmailConnections.$inferSelect;
export type InsertGmailConnection = z.infer<typeof insertGmailConnectionSchema>;