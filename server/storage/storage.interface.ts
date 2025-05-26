import { ApplicationStatus } from '@shared/schema';

export interface DatabaseStorage {
  getApplicationsByUserIdPaginated(
    userId: number,
    page: number,
    pageSize: number,
    status?: typeof ApplicationStatus[keyof typeof ApplicationStatus],
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<any[]>;

  getApplicationsCountByUserId(
    userId: number,
    status?: typeof ApplicationStatus[keyof typeof ApplicationStatus],
    searchTerm?: string
  ): Promise<number>;

  getApplicationById(id: number): Promise<any>;

  createApplication(data: {
    userId: number;
    company: string;
    position: string;
    status: typeof ApplicationStatus[keyof typeof ApplicationStatus];
    appliedDate?: Date;
    notes?: string;
    description?: string;
    url?: string;
  }): Promise<any>;

  updateApplication(
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
  ): Promise<any>;

  deleteApplication(id: number): Promise<void>;

  cleanupApplications(userId: number): Promise<void>;
} 