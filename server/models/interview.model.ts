import { eq } from 'drizzle-orm';
import { interviews } from './schema';
import { Interview, InsertInterview } from '@shared/schema';
import { db } from '../utils/db';

export class InterviewModel {
  async findById(id: number): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id));
    return interview as Interview;
  }

  async findByApplicationId(applicationId: number): Promise<Interview[]> {
    const results = await db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(interviews.scheduledDate);
    return results as Interview[];
  }

  async findByUserId(userId: number): Promise<Interview[]> {
    const results = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(interviews.scheduledDate);
    return results as Interview[];
  }

  async create(data: InsertInterview): Promise<Interview> {
    const [interview] = await db
      .insert(interviews)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return interview as Interview;
  }

  async update(id: number, data: Partial<Interview>): Promise<Interview> {
    const [interview] = await db
      .update(interviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return interview as Interview;
  }

  async delete(id: number): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }
} 