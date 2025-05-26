import { Application, Document, Interview, TimelineEvent, InterviewStep, Contact, InterviewQuestion, InterviewAssistance, SheetImportSettings, JobProfile } from '@shared/schema';

export interface DatabaseStorage {
  // Application methods
  getApplicationsByUserIdPaginated(
    userId: number,
    limit: number,
    offset: number,
    status?: string,
    search?: string,
    sortBy?: string,
    sortOrder?: string
  ): Promise<Application[]>;
  getApplicationsCountByUserId(userId: number, status?: string, search?: string): Promise<number>;
  getApplicationById(id: number): Promise<Application | null>;
  createApplication(data: any): Promise<Application>;
  updateApplication(id: number, data: any): Promise<Application>;
  deleteApplication(id: number): Promise<void>;
  cleanupApplications(userId: number): Promise<number>;

  // Document methods
  getDocumentsByUserId(userId: number, type?: string): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | null>;
  createDocument(data: any): Promise<Document>;
  updateDocument(id: number, data: any): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Interview methods
  getInterviewsByUserId(userId: number): Promise<Interview[]>;
  getInterviewById(id: number): Promise<Interview | null>;
  createInterview(data: any): Promise<Interview>;
  updateInterview(id: number, data: any): Promise<Interview>;
  deleteInterview(id: number): Promise<void>;

  // Interview Step methods
  getInterviewStepsByApplicationId(applicationId: number): Promise<InterviewStep[]>;
  createInterviewStep(data: any): Promise<InterviewStep>;
  updateInterviewStep(id: number, data: any): Promise<InterviewStep>;
  deleteInterviewStep(id: number): Promise<void>;

  // Timeline methods
  getTimelineEventsByApplicationId(applicationId: number): Promise<TimelineEvent[]>;
  createTimelineEvent(data: any): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, data: any): Promise<TimelineEvent>;
  deleteTimelineEvent(id: number): Promise<void>;

  // Contact methods
  getContactsByApplicationId(applicationId: number): Promise<Contact[]>;
  createContact(data: any): Promise<Contact>;
  updateContact(id: number, data: any): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Interview Question methods
  getInterviewQuestionsByUserId(userId: number): Promise<InterviewQuestion[]>;
  getPublicInterviewQuestions(filters: any, limit?: number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(data: any): Promise<InterviewQuestion>;
  updateInterviewQuestion(id: number, data: any): Promise<InterviewQuestion>;
  deleteInterviewQuestion(id: number): Promise<void>;
  voteInterviewQuestion(questionId: number, userId: number, isUpvote: boolean): Promise<InterviewQuestion>;

  // Interview Assistance methods
  getInterviewAssistanceByUserId(userId: number): Promise<InterviewAssistance[]>;
  createInterviewAssistance(data: any): Promise<InterviewAssistance>;
  updateInterviewAssistance(id: number, data: any): Promise<InterviewAssistance>;
  deleteInterviewAssistance(id: number): Promise<void>;

  // Sheet Import Settings methods
  getSheetImportSettingsByUserId(userId: number): Promise<SheetImportSettings[]>;
  getSheetImportSettingsById(id: number): Promise<SheetImportSettings | null>;
  createSheetImportSettings(data: any): Promise<SheetImportSettings>;
  updateSheetImportSettings(id: number, data: any): Promise<SheetImportSettings>;
  deleteSheetImportSettings(id: number): Promise<void>;

  // Job Profile methods
  getJobProfilesByUserId(userId: number): Promise<JobProfile[]>;
  getJobProfileById(id: number): Promise<JobProfile | null>;
  createJobProfile(data: any): Promise<JobProfile>;
  updateJobProfile(id: number, data: any): Promise<JobProfile>;
  deleteJobProfile(id: number): Promise<void>;

  // Dashboard methods
  getDashboardStats(userId: number): Promise<any>;
} 