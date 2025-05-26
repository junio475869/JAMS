import { DocumentModel } from '../models/document.model';
import { Document, InsertDocument, DocumentType } from '@shared/schema';

export class DocumentController {
  private documentModel: DocumentModel;

  constructor() {
    this.documentModel = new DocumentModel();
  }

  async getDocumentsByUserId(userId: number, type?: DocumentType): Promise<Document[]> {
    return this.documentModel.findByUserId(userId, type);
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documentModel.findById(id);
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    return this.documentModel.create(data);
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    return this.documentModel.update(id, data);
  }

  async deleteDocument(id: number): Promise<void> {
    await this.documentModel.delete(id);
  }
} 