import { ApplicationModel } from '../models/application.model';
import { Application, InsertApplication, ApplicationStatus } from '@shared/schema';

export class ApplicationController {
  private applicationModel: ApplicationModel;

  constructor() {
    this.applicationModel = new ApplicationModel();
  }

  async getApplicationsByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    status?: ApplicationStatus,
    searchTerm?: string
  ) {
    return this.applicationModel.findByUserIdPaginated(userId, page, limit, status, searchTerm);
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    return this.applicationModel.findById(id);
  }

  async createApplication(data: InsertApplication): Promise<Application> {
    return this.applicationModel.create(data);
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application> {
    return this.applicationModel.update(id, data);
  }

  async deleteApplication(id: number): Promise<void> {
    await this.applicationModel.delete(id);
  }

  async cleanupApplications(userId: number): Promise<void> {
    await this.applicationModel.cleanupApplications(userId);
  }
} 