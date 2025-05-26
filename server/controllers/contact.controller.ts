import { ContactModel } from '../models/contact.model';
import { Contact, InsertContact } from '@shared/schema';

export class ContactController {
  constructor(private contactModel: ContactModel) {}

  async getContactById(id: number): Promise<Contact | undefined> {
    return this.contactModel.findById(id);
  }

  async getContactsByApplicationId(applicationId: number): Promise<Contact[]> {
    return this.contactModel.findByApplicationId(applicationId);
  }

  async getContactsByUserId(userId: number): Promise<Contact[]> {
    return this.contactModel.findByUserId(userId);
  }

  async createContact(data: InsertContact): Promise<Contact> {
    return this.contactModel.create(data);
  }

  async updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
    return this.contactModel.update(id, data);
  }

  async deleteContact(id: number): Promise<void> {
    await this.contactModel.delete(id);
  }
} 