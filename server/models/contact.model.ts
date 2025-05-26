import { eq } from 'drizzle-orm';
import { contacts } from './schema';
import { Contact, InsertContact } from '@shared/schema';

export class ContactModel {
  constructor(private db: any) {}

  async findById(id: number): Promise<Contact | undefined> {
    const [contact] = await this.db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact;
  }

  async findByApplicationId(applicationId: number): Promise<Contact[]> {
    return this.db
      .select()
      .from(contacts)
      .where(eq(contacts.applicationId, applicationId))
      .orderBy(contacts.id);
  }

  async findByUserId(userId: number): Promise<Contact[]> {
    return this.db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.id);
  }

  async create(data: InsertContact): Promise<Contact> {
    const [contact] = await this.db
      .insert(contacts)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return contact;
  }

  async update(id: number, data: Partial<Contact>): Promise<Contact> {
    const [contact] = await this.db
      .update(contacts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(contacts).where(eq(contacts.id, id));
  }
} 