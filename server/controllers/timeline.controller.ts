import { TimelineModel } from '../models/timeline.model';
import { TimelineEvent, InsertTimelineEvent } from '@shared/schema';

export class TimelineController {
  private timelineModel: TimelineModel;

  constructor(db: any) {
    this.timelineModel = new TimelineModel(db);
  }

  async getTimelineEventById(id: number): Promise<TimelineEvent | undefined> {
    return this.timelineModel.findById(id);
  }

  async getTimelineEventsByApplicationId(applicationId: number): Promise<TimelineEvent[]> {
    return this.timelineModel.findByApplicationId(applicationId);
  }

  async getTimelineEventsByUserId(userId: number): Promise<TimelineEvent[]> {
    return this.timelineModel.findByUserId(userId);
  }

  async createTimelineEvent(data: InsertTimelineEvent): Promise<TimelineEvent> {
    return this.timelineModel.create(data);
  }

  async updateTimelineEvent(id: number, data: Partial<TimelineEvent>): Promise<TimelineEvent> {
    return this.timelineModel.update(id, data);
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    await this.timelineModel.delete(id);
  }
} 