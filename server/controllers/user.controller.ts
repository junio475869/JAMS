import { UserModel } from '../models/user.model';
import { User, InsertUser } from '@shared/schema';

export class UserController {
  constructor(private userModel: UserModel) {}

  async getUserById(id: number): Promise<User | undefined> {
    return this.userModel.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userModel.findByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findByEmail(email);
  }

  async getUserByFirebaseUID(firebaseUID: string): Promise<User | undefined> {
    return this.userModel.findByFirebaseUID(firebaseUID);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async getUsersByTeamId(teamId: number): Promise<User[]> {
    return this.userModel.findByTeamId(teamId);
  }

  async createUser(data: InsertUser): Promise<User> {
    return this.userModel.create(data);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.userModel.update(id, data);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userModel.delete(id);
  }
} 