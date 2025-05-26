import { eq, and, like, sql } from 'drizzle-orm';
import { applications } from './schema';
import { Application, InsertApplication, ApplicationStatus } from '@shared/schema';
import { db } from '../utils/db';

export class ApplicationModel {
  async findById(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application as Application;
  }

  async findByUserId(userId: number): Promise<Application[]> {
    const results = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(applications.appliedDate);
    return results as Application[];
  }

  async findByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    status?: typeof ApplicationStatus[keyof typeof ApplicationStatus],
    searchTerm?: string
  ): Promise<{ applications: Application[]; totalPages: number; currentPage: number; totalItems: number; itemsPerPage: number }> {
    const offset = (page - 1) * limit;
    let query = db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    if (searchTerm) {
      query = query.where(
        and(
          eq(applications.userId, userId),
          like(applications.company, `%${searchTerm}%`)
        )
      );
    }

    const [totalItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.userId, userId));

    const totalPages = Math.ceil(totalItems.count / limit);

    const results = await query
      .orderBy(applications.appliedDate)
      .limit(limit)
      .offset(offset);

    return {
      applications: results as Application[],
      totalPages,
      currentPage: page,
      totalItems: totalItems.count,
      itemsPerPage: limit,
    };
  }

  async create(data: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return application as Application;
  }

  async update(id: number, data: Partial<Application>): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application as Application;
  }

  async delete(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async cleanupApplications(userId: number): Promise<void> {
    await db.delete(applications).where(eq(applications.userId, userId));
  }
} 