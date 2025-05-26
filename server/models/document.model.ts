import { eq } from 'drizzle-orm';
import { documents } from './schema';
import { Document, InsertDocument, DocumentType } from '@shared/schema';
import { db } from '../utils/db';

export class DocumentModel {
  async findById(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async findByUserId(userId: number, type?: DocumentType): Promise<Document[]> {
    let query = db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));

    if (type) {
      query = query.where(eq(documents.type, type));
    }

    return query.orderBy(documents.createdAt);
  }

  async create(data: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return document;
  }

  async update(id: number, data: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async delete(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
} 