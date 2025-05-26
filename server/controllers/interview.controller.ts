import { InterviewModel } from '../models/interview.model';
import { Interview, InsertInterview } from '@shared/schema';

export class InterviewController {
  private interviewModel: InterviewModel;

  constructor() {
    this.interviewModel = new InterviewModel();
  }

  async getInterviewById(id: number): Promise<Interview | undefined> {
    return this.interviewModel.findById(id);
  }

  async getInterviewsByApplicationId(applicationId: number): Promise<Interview[]> {
    return this.interviewModel.findByApplicationId(applicationId);
  }

  async getInterviewsByUserId(userId: number): Promise<Interview[]> {
    return this.interviewModel.findByUserId(userId);
  }

  async createInterview(data: InsertInterview): Promise<Interview> {
    return this.interviewModel.create(data);
  }

  async updateInterview(id: number, data: Partial<Interview>): Promise<Interview> {
    return this.interviewModel.update(id, data);
  }

  async deleteInterview(id: number): Promise<void> {
    await this.interviewModel.delete(id);
  }
} 