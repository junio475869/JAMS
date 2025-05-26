import { eq } from 'drizzle-orm';
import { timelineEvents } from './schema';
import { TimelineEvent, InsertTimelineEvent } from '@shared/schema';

export class TimelineModel {
  constructor(private db: any) {}

  async findById(id: number): Promise<TimelineEvent | undefined> {
    const [event] = await this.db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.id, id));
    return event;
  }

  async findByApplicationId(applicationId: number): Promise<TimelineEvent[]> {
    return this.db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.applicationId, applicationId))
      .orderBy(timelineEvents.date);
  }

  async findByUserId(userId: number): Promise<TimelineEvent[]> {
    return this.db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.userId, userId))
      .orderBy(timelineEvents.date);
  }

  async create(data: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await this.db
      .insert(timelineEvents)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return event;
  }

  async update(id: number, data: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const [event] = await this.db
      .update(timelineEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timelineEvents.id, id))
      .returning();
    return event;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }
} 