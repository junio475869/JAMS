import { eq } from 'drizzle-orm';
import { interviewPrepQuestions, mockInterviews, aiInterviewResponses } from './schema';
import { db } from '../utils/db';

export class InterviewPrepModel {
  // Interview Prep Questions
  async findQuestions(userId: number) {
    const results = await db
      .select()
      .from(interviewPrepQuestions)
      .where(eq(interviewPrepQuestions.userId, userId))
      .orderBy(interviewPrepQuestions.createdAt);
    return results;
  }

  async createQuestion(data: {
    userId: number;
    question: string;
    answer?: string;
    category: string;
    difficulty: string;
    company?: string;
    role?: string;
    tags?: string[];
    isPublic?: boolean;
  }) {
    const [question] = await db
      .insert(interviewPrepQuestions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return question;
  }

  async updateQuestion(id: number, data: Partial<typeof interviewPrepQuestions.$inferSelect>) {
    const [question] = await db
      .update(interviewPrepQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interviewPrepQuestions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: number) {
    await db.delete(interviewPrepQuestions).where(eq(interviewPrepQuestions.id, id));
  }

  // Mock Interviews
  async findMockInterviews(userId: number) {
    const results = await db
      .select()
      .from(mockInterviews)
      .where(eq(mockInterviews.userId, userId))
      .orderBy(mockInterviews.createdAt);
    return results;
  }

  async createMockInterview(data: {
    userId: number;
    title: string;
    role: string;
    company?: string;
    duration: number;
    questionCount: number;
    difficulty: string;
    questions: {
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
    }[];
  }) {
    const [interview] = await db
      .insert(mockInterviews)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return interview;
  }

  async updateMockInterview(id: number, data: Partial<typeof mockInterviews.$inferSelect>) {
    const [interview] = await db
      .update(mockInterviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mockInterviews.id, id))
      .returning();
    return interview;
  }

  async deleteMockInterview(id: number) {
    await db.delete(mockInterviews).where(eq(mockInterviews.id, id));
  }

  // AI Interview Responses
  async findAIResponses(userId: number) {
    const results = await db
      .select()
      .from(aiInterviewResponses)
      .where(eq(aiInterviewResponses.userId, userId))
      .orderBy(aiInterviewResponses.timestamp);
    return results;
  }

  async createAIResponse(data: {
    userId: number;
    question: string;
    response: string;
  }) {
    const [response] = await db
      .insert(aiInterviewResponses)
      .values({
        ...data,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return response;
  }

  async deleteAIResponse(id: number) {
    await db.delete(aiInterviewResponses).where(eq(aiInterviewResponses.id, id));
  }
} 