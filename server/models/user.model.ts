import { eq } from 'drizzle-orm';

import { User, InsertUser, users } from '@shared/schema';

export class UserModel {
  constructor(private db: any) {}

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findByFirebaseUID(firebaseUID: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.firebaseUID, firebaseUID));
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users).orderBy(users.id);
  }

  async findByTeamId(teamId: number): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(eq(users.teamId, teamId))
      .orderBy(users.id);
  }

  async create(data: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
} 