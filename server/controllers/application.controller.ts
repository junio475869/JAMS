
import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertApplicationSchema, insertInterviewStepSchema } from '@shared/schema';

export const getApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "updatedAt";
    const sortOrder = ((req.query.sortOrder as string) || "desc").toLowerCase();
    const offset = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      storage.getApplicationsByUserIdPaginated(
        req.user!.id,
        limit,
        offset,
        status,
        search,
        sortBy,
        sortOrder,
      ),
      storage.getApplicationsCountByUserId(req.user!.id, status, search),
    ]);

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
      itemsPerPage: limit,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const userData = { ...req.body, userId: req.user!.id };
    const validatedData = insertApplicationSchema.parse(userData);
    const application = await storage.createApplication(validatedData);

    await storage.createTimelineEvent({
      applicationId: application.id,
      userId: req.user!.id,
      title: "Application Submitted",
      description: `Applied for ${application.position} at ${application.company}`,
      type: "application",
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid request" });
  }
};

export const getApplicationById = async (req: Request, res: Response) => {
  const applicationId = parseInt(req.params.id);
  if (isNaN(applicationId)) {
    return res.status(400).json({ error: "Invalid application ID" });
  }

  const application = await storage.getApplicationById(applicationId);
  if (!application || application.userId !== req.user!.id) {
    return res.status(404).json({ error: "Application not found" });
  }

  res.json(application);
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const updatedApplication = await storage.updateApplication(applicationId, req.body);
    res.json(updatedApplication);
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid request" });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  const applicationId = parseInt(req.params.id);
  if (isNaN(applicationId)) {
    return res.status(400).json({ error: "Invalid application ID" });
  }

  const application = await storage.getApplicationById(applicationId);
  if (!application || application.userId !== req.user!.id) {
    return res.status(404).json({ error: "Application not found" });
  }

  await storage.deleteApplication(applicationId);
  res.status(204).send();
};

// Interview steps controllers
export const getInterviewSteps = async (req: Request, res: Response) => {
  const applicationId = parseInt(req.params.id);
  if (isNaN(applicationId)) {
    return res.status(400).json({ error: "Invalid application ID" });
  }

  const steps = await storage.getInterviewStepsByApplicationId(applicationId);
  res.json(steps);
};

export const createInterviewStep = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    const step = await storage.createInterviewStep({
      ...req.body,
      applicationId,
    });

    if (step.scheduledDate) {
      await storage.createTimelineEvent({
        applicationId,
        userId: req.user!.id,
        title: "Interview Step Added",
        description: `${step.stepName} scheduled for ${new Date(step.scheduledDate).toLocaleDateString()}`,
        type: "interview",
        date: step.scheduledDate,
      });
    }

    res.status(201).json(step);
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid request" });
  }
};

export const updateInterviewStep = async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const updatedStep = await storage.updateInterviewStep(stepId, req.body);
    res.json(updatedStep);
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid request" });
  }
};

export const deleteInterviewStep = async (req: Request, res: Response) => {
  const stepId = parseInt(req.params.stepId);
  await storage.deleteInterviewStep(stepId);
  res.status(204).send();
};
