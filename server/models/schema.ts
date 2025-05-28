import { pgTable, serial, text, timestamp, integer, boolean, json } from 'drizzle-orm/pg-core';
import { ApplicationStatus, DocumentType } from '@shared/schema.js';

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  company: text('company').notNull(),
  position: text('position').notNull(),
  status: text('status').$type<typeof ApplicationStatus[keyof typeof ApplicationStatus]>().notNull(),
  appliedDate: timestamp('applied_date'),
  notes: text('notes'),
  description: text('description'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: text('type').$type<DocumentType>().notNull(),
  title: text('title').notNull(),
  content: text('content'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  applicationId: integer('application_id'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviewSteps = pgTable('interview_steps', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull(),
  stepName: text('step_name').notNull(),
  scheduledDate: timestamp('scheduled_date'),
  completed: boolean('completed').default(false),
  interviewerName: text('interviewer_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const timelineEvents = pgTable('timeline_events', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  date: timestamp('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  title: text('title'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviewQuestions = pgTable('interview_questions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  category: text('category'),
  difficulty: text('difficulty'),
  company: text('company'),
  role: text('role'),
  isPublic: boolean('is_public').default(false),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviewAssistance = pgTable('interview_assistance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  interviewId: integer('interview_id'),
  questions: json('questions').$type<string[]>(),
  answers: json('answers').$type<string[]>(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sheetImportSettings = pgTable('sheet_import_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  columnMapping: json('column_mapping').$type<Record<string, number>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const jobProfiles = pgTable('job_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  skills: json('skills').$type<string[]>(),
  experience: text('experience'),
  education: text('education'),
  birthday: timestamp('birthday'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviewPrepQuestions = pgTable('interview_prep_questions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(),
  company: text('company'),
  role: text('role'),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  tags: text('tags').$type<string[]>(),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const mockInterviews = pgTable('mock_interviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  role: text('role').notNull(),
  company: text('company'),
  duration: integer('duration').notNull(), // in minutes
  questionCount: integer('question_count').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  score: integer('score'),
  feedback: text('feedback'),
  questions: json('questions').$type<{
    id: string;
    question: string;
    answer?: string;
    aiAnalysis?: {
      score: number;
      feedback: string;
      strengths: string[];
      weaknesses: string[];
      improvementSuggestions: string[];
    };
  }[]>(),
});

export const aiInterviewResponses = pgTable('ai_interview_responses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  question: text('question').notNull(),
  response: text('response').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export default {
  applications,
  documents,
  interviews,
  interviewQuestions,
  interviewPrepQuestions,
  mockInterviews,
  aiInterviewResponses,
}; 