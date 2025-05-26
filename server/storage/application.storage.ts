import { eq, or, asc, desc, like, and, SQL } from 'drizzle-orm';
import { DatabaseStorage } from './storage.interface';
import { applications } from '../models/schema';
import { ApplicationStatus } from '@shared/schema';

export class ApplicationStorage implements DatabaseStorage {
  constructor(private db: any) {}

  async getApplicationsByUserIdPaginated(
    userId: number,
    page: number,
    pageSize: number,
    status?: typeof ApplicationStatus[keyof typeof ApplicationStatus],
    searchTerm?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * pageSize;
    const query = this.db.select().from(applications);

    let whereClause = eq(applications.userId, userId);
    if (status) {
      whereClause = and(whereClause, eq(applications.status, status));
    }
    if (searchTerm) {
      whereClause = and(
        whereClause,
        or(
          like(applications.company, `%${searchTerm}%`),
          like(applications.position, `%${searchTerm}%`)
        )
      );
    }

    const orderBy = sortOrder === 'asc' ? asc(applications[sortBy]) : desc(applications[sortBy]);

    return query.where(whereClause).orderBy(orderBy).limit(pageSize).offset(offset);
  }

  async getApplicationsCountByUserId(
    userId: number,
    status?: typeof ApplicationStatus[keyof typeof ApplicationStatus],
    searchTerm?: string
  ) {
    const query = this.db.select().from(applications);

    let whereClause = eq(applications.userId, userId);
    if (status) {
      whereClause = and(whereClause, eq(applications.status, status));
    }
    if (searchTerm) {
      whereClause = and(
        whereClause,
        or(
          like(applications.company, `%${searchTerm}%`),
          like(applications.position, `%${searchTerm}%`)
        )
      );
    }

    const result = await query.where(whereClause).count();
    return result[0].count;
  }

  async getApplicationById(id: number) {
    const result = await this.db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return result[0];
  }

  async createApplication(data: {
    userId: number;
    company: string;
    position: string;
    status: typeof ApplicationStatus[keyof typeof ApplicationStatus];
    appliedDate?: Date;
    notes?: string;
    description?: string;
    url?: string;
  }) {
    const result = await this.db.insert(applications).values(data).returning();
    return result[0];
  }

  async updateApplication(
    id: number,
    data: {
      company?: string;
      position?: string;
      status?: typeof ApplicationStatus[keyof typeof ApplicationStatus];
      appliedDate?: Date;
      notes?: string;
      description?: string;
      url?: string;
    }
  ) {
    const result = await this.db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return result[0];
  }

  async deleteApplication(id: number) {
    await this.db.delete(applications).where(eq(applications.id, id));
  }

  async cleanupApplications(userId: number) {
    await this.db
      .delete(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, ApplicationStatus.APPLIED)
        )
      );
  }
} 