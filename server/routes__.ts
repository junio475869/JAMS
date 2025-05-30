import type { Express } from "express";
// Error handling type for better error messages
type ApiError = Error | { message?: string };
import { createServer, type Server } from "http";
import { setupAuth } from "./middleware/auth";
import { setupTeamRoutes } from "./team-routes";
import { storage } from "./storage";
import {
  generateCoverLetter,
  analyzeResume,
  generateInterviewQuestions,
  generateResponseToQuestion,
  analyzeInterviewTranscript,
  generateInterviewFeedback,
  createMockInterview,
  analyzeApplicationStatus,
  StatusColorAnalysis,
} from "./utils/ai";
import { z } from "zod";
import {
  insertApplicationSchema,
  insertDocumentSchema,
  insertInterviewSchema,
  insertContactSchema,
  insertTimelineEventSchema,
  insertInterviewQuestionSchema,
  insertInterviewAssistanceSchema,
  ApplicationStatus,
  DocumentType,
  InterviewQuestionCategory,
  InterviewQuestionDifficulty,
  insertSheetImportSettingsSchema,
} from "@shared/schema";
import { db } from "./utils/db";
import { gmailService } from "./services/gmail";
import { CalendarService } from "./microservices/calendar/calendar.service";
import { searchJobs } from "./services/job-platforms";
import { JOB_PLATFORMS } from "../client/src/config/job-platforms";
import gmailRoutes from "./routes/gmail.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Sets up team management routes
  setupTeamRoutes(app);

  // Register Gmail routes
  app.use("/api/gmail", gmailRoutes);

  // Application endpoints
  app.get("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "updatedAt";
    const sortOrder = ((req.query.sortOrder as string) || "desc").toLowerCase();
    const offset = (page - 1) * limit;

    try {
      const [applications, total] = await Promise.all([
        storage.getApplicationsByUserIdPaginated(
          req.user!.id,
          limit,
          offset,
          status,
          search,
          sortBy,
          sortOrder
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
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertApplicationSchema.parse(userData);
      const application = await storage.createApplication(validatedData);

      // Create a timeline event for this application
      await storage.createTimelineEvent({
        applicationId: application.id,
        userId: req.user!.id,
        title: "Application Submitted",
        description: `Applied for ${application.position} at ${application.company}`,
        type: "application",
      });

      res.status(201).json(application);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  });

  app.put("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    console.log("Application ID:", applicationId, req.body);
    try {
      const updatedApplication = await storage.updateApplication(
        applicationId,
        req.body
      );

      // If status has changed, add timeline event
      if (req.body.status && req.body.status !== application.status) {
        let eventTitle = "Status Updated";
        let eventType = "note";

        if (req.body.status === ApplicationStatus.INTERVIEW) {
          eventTitle = "Interview Stage";
          eventType = "interview";
        } else if (req.body.status === ApplicationStatus.OFFER) {
          eventTitle = "Received Offer";
          eventType = "offer";
        } else if (req.body.status === ApplicationStatus.REJECTED) {
          eventTitle = "Application Rejected";
          eventType = "rejection";
        }

        await storage.createTimelineEvent({
          applicationId: applicationId,
          userId: req.user!.id,
          title: eventTitle,
          description: `Status changed from ${application.status} to ${req.body.status}`,
          type: eventType,
        });
      }

      // Handle interview steps if provided
      if (req.body.interviewSteps) {
        // Delete existing steps
        const existingSteps =
          await storage.getInterviewStepsByApplicationId(applicationId);
        for (const step of existingSteps) {
          await storage.deleteInterviewStep(step.id);
        }

        // Create new steps and timeline events
        for (const step of req.body.interviewSteps) {
          const createdStep = await storage.createInterviewStep({
            ...step,
            applicationId,
          });

          // Create timeline event for scheduled interviews
          if (createdStep.scheduledDate) {
            await storage.createTimelineEvent({
              applicationId,
              userId: req.user!.id,
              title: "Interview Scheduled",
              description: `${createdStep.stepName} interview scheduled${createdStep.interviewerName ? ` with ${createdStep.interviewerName}` : ""}`,
              type: "interview",
              date: createdStep.scheduledDate,
            });
          }
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
  });

  // Document endpoints
  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const type = req.query.type as string | undefined;
    const documents = await storage.getDocumentsByUserId(req.user!.id, type);
    res.json(documents);
  });

  app.post("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertDocumentSchema.parse(userData);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user!.id) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  });

  app.patch("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user!.id) {
      return res.status(404).json({ error: "Document not found" });
    }

    try {
      // If content is changing, increment version
      let version = document.version;
      if (req.body.content && req.body.content !== document.content) {
        version += 1;
      }

      const updatedData = { ...req.body, version, updatedAt: new Date() };
      const updatedDocument = await storage.updateDocument(
        documentId,
        updatedData
      );
      res.json(updatedDocument);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await storage.getDocumentById(documentId);
    if (!document || document.userId !== req.user!.id) {
      return res.status(404).json({ error: "Document not found" });
    }

    await storage.deleteDocument(documentId);
    res.status(204).send();
  });

  // Interview endpoints
  app.get("/api/interviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
    const interviews = await storage.getInterviewsByUserId(req.user!.id);
    res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  app.post("/api/interviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertInterviewSchema.parse(userData);

      // Check that the application belongs to the user
      const application = await storage.getApplicationById(
        validatedData.applicationId ?? 0
      );
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      const interview = await storage.createInterview(validatedData);

      // Create a timeline event for this interview
      await storage.createTimelineEvent({
        applicationId: validatedData.applicationId ?? 0,
        userId: req.user!.id,
        title: "Interview Scheduled",
        description: `${interview.type} interview scheduled for ${interview.title} at ${interview.company}`,
        type: "interview",
      });

      res.status(201).json(interview);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Contact endpoints
  app.get("/api/applications/:id/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const contacts = await storage.getContactsByApplicationId(applicationId);
    res.json(contacts);
  });

  app.post("/api/applications/:id/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    try {
      const userData = { ...req.body, applicationId, userId: req.user!.id };
      const validatedData = insertContactSchema.parse(userData);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Timeline endpoints
  // Interview Steps endpoints
  app.get("/api/applications/:id/interview-steps", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const steps = await storage.getInterviewStepsByApplicationId(applicationId);
    res.json(steps);
  });

  app.post("/api/applications/:id/interview-steps", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    try {
      const step = await storage.createInterviewStep({
        ...req.body,
        applicationId,
      });

      // Create timeline event for the new step
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
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.put(
    "/api/applications/:appId/interview-steps/:stepId",
    async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const applicationId = parseInt(req.params.appId);
      const stepId = parseInt(req.params.stepId);
      if (isNaN(applicationId) || isNaN(stepId)) {
        return res.status(400).json({ error: "Invalid ID provided" });
      }

      const application = await storage.getApplicationById(applicationId);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      try {
        const updatedStep = await storage.updateInterviewStep(stepId, req.body);

        // Create timeline event for status change
        if (req.body.completed !== undefined) {
          await storage.createTimelineEvent({
            applicationId,
            userId: req.user!.id,
            title: req.body.completed
              ? "Interview Step Completed"
              : "Interview Step Reopened",
            description: `${updatedStep.stepName} ${req.body.completed ? "completed" : "reopened"}`,
            type: "interview",
            date: new Date(),
          });
        }

        res.json(updatedStep);
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : "Invalid request",
        });
      }
    }
  );

  app.delete(
    "/api/applications/:appId/interview-steps/:stepId",
    async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const applicationId = parseInt(req.params.appId);
      const stepId = parseInt(req.params.stepId);
      if (isNaN(applicationId) || isNaN(stepId)) {
        return res.status(400).json({ error: "Invalid ID provided" });
      }

      const application = await storage.getApplicationById(applicationId);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      await storage.deleteInterviewStep(stepId);
      res.status(204).send();
    }
  );

  app.get("/api/applications/:id/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const timeline =
      await storage.getTimelineEventsByApplicationId(applicationId);
    res.json(timeline);
  });

  app.post("/api/applications/:id/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const application = await storage.getApplicationById(applicationId);
    if (!application || application.userId !== req.user!.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    try {
      const userData = { ...req.body, applicationId, userId: req.user!.id };
      const validatedData = insertTimelineEventSchema.parse(userData);
      const event = await storage.createTimelineEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const stats = await storage.getDashboardStats(req.user!.id);
    res.json(stats);
  });

  // AI endpoints
  app.post("/api/ai/cover-letter", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      jobDescription: z.string(),
      resumeId: z.number().optional(),
      company: z.string(),
      position: z.string(),
    });

    try {
      const { jobDescription, resumeId, company, position } = schema.parse(
        req.body
      );

      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (
          resume &&
          resume.userId === req.user!.id &&
          resume.type === DocumentType.RESUME
        ) {
          resumeContent = resume.content;
        }
      }

      const coverLetter = await generateCoverLetter(
        jobDescription,
        resumeContent,
        company,
        position
      );

      res.json({ coverLetter });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/ai/resume-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      resumeId: z.number(),
      jobDescription: z.string(),
    });

    try {
      const { resumeId, jobDescription } = schema.parse(req.body);

      const resume = await storage.getDocumentById(resumeId);
      if (
        !resume ||
        resume.userId !== req.user!.id ||
        resume.type !== DocumentType.RESUME
      ) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const analysis = await analyzeResume(resume.content, jobDescription);

      res.json({ analysis });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Application Status Visualization endpoint
  app.post("/api/ai/application-status-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      applicationId: z.number(),
    });

    try {
      const { applicationId } = schema.parse(req.body);

      // Get the application
      const application = await storage.getApplicationById(applicationId);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Get timeline events for status history
      const timelineEvents =
        await storage.getTimelineEventsByApplicationId(applicationId);
      const statusHistory = timelineEvents
        .filter(
          (event) =>
            event.title.includes("Status") ||
            event.type === "application" ||
            event.type === "interview" ||
            event.type === "offer" ||
            event.type === "rejection"
        )
        .map((event) => ({
          status: event.title.includes("Status")
            ? event.description?.split("to ")[1]
            : event.type === "application"
              ? "applied"
              : event.type === "interview"
                ? "interview"
                : event.type === "offer"
                  ? "offer"
                  : event.type === "rejection"
                    ? "rejected"
                    : "unknown",
          date: event.date,
        }));

      // Call the AI to analyze the application status
      // Ensure we handle null values for date fields
      const safeApplication = {
        company: application.company,
        position: application.position,
        status: application.status,
        appliedDate: application.appliedDate,
        notes: application.notes,
        description: application.description,
      };

      const colorAnalysis = await analyzeApplicationStatus(
        safeApplication,
        statusHistory
      );

      res.json({ colorAnalysis });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });

  // Interview Question endpoints
  app.get("/api/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const questions = await storage.getInterviewQuestionsByUserId(req.user!.id);
    res.json(questions);
  });

  app.get("/api/interview-questions/public", async (req, res) => {
    // Public questions, no auth required
    const filters = {
      company: req.query.company as string | undefined,
      role: req.query.role as string | undefined,
      category: req.query.category as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
    };

    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const questions = await storage.getPublicInterviewQuestions(filters, limit);
    res.json(questions);
  });

  app.post("/api/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertInterviewQuestionSchema.parse(userData);
      const question = await storage.createInterviewQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/interview-questions/:id/vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const questionId = parseInt(req.params.id);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const schema = z.object({
      isUpvote: z.boolean(),
    });

    try {
      const { isUpvote } = schema.parse(req.body);

      const updatedQuestion = await storage.voteInterviewQuestion(
        questionId,
        req.user!.id,
        isUpvote
      );

      res.json(updatedQuestion);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Interview Assistance endpoints
  app.get("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const assistances = await storage.getInterviewAssistanceByUserId(
      req.user!.id
    );
    res.json(assistances);
  });

  app.post("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertInterviewAssistanceSchema.parse(userData);

      // Check that the interview belongs to the user if provided
      if (validatedData.interviewId) {
        const interview = await storage.getInterviewById(
          validatedData.interviewId
        );
        if (!interview || interview.userId !== req.user!.id) {
          return res.status(404).json({ error: "Interview not found" });
        }
      }

      const assistance = await storage.createInterviewAssistance(validatedData);
      res.status(201).json(assistance);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // AI Interview endpoints
  app.post("/api/ai/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      jobDescription: z.string(),
      position: z.string(),
      company: z.string(),
    });

    try {
      const { jobDescription, position, company } = schema.parse(req.body);

      const questions = await generateInterviewQuestions(
        jobDescription,
        position,
        company
      );

      res.json({ questions });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/ai/interview-answer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      question: z.string(),
      resumeId: z.number().optional(),
      framework: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      tone: z.string().optional(),
    });

    try {
      const { question, resumeId, framework, keywords, tone } = schema.parse(
        req.body
      );

      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (
          resume &&
          resume.userId === req.user!.id &&
          resume.type === DocumentType.RESUME
        ) {
          resumeContent = resume.content;
        }
      }

      const answer = await generateResponseToQuestion(
        question,
        resumeContent,
        framework,
        keywords,
        tone
      );

      res.json({ answer });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/ai/interview-feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      questions: z.array(z.string()),
      answers: z.array(z.string()),
      position: z.string(),
    });

    try {
      const { questions, answers, position } = schema.parse(req.body);

      const feedback = await generateInterviewFeedback(
        questions,
        answers,
        position
      );

      res.json({ feedback });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/ai/mock-interview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      position: z.string(),
      company: z.string(),
      level: z.string().optional(),
      focusAreas: z.array(z.string()).optional(),
    });

    try {
      const { position, company, level, focusAreas } = schema.parse(req.body);

      const mockInterview = await createMockInterview(
        position,
        company,
        level,
        focusAreas
      );

      res.json(mockInterview);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  app.post("/api/ai/interview-transcript-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      transcript: z.string(),
      jobDescription: z.string(),
      position: z.string(),
    });

    try {
      const { transcript, jobDescription, position } = schema.parse(req.body);

      const analysis = await analyzeInterviewTranscript(
        transcript,
        jobDescription,
        position
      );

      res.json({ analysis });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Gmail endpoints
  app.get("/api/gmail/auth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const authUrl = gmailService.getAuthUrl();
    res.json({ authUrl });
  });

  app.get("/api/gmail/oauth/callback", async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
      await gmailService.handleCallback(code, req.user!.id);
      res.redirect("/email");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Failed to complete OAuth flow" });
    }
  });

  app.get("/api/calendar/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const connections = await storage.getGmailConnections(req.user!.id);
      if (!connections || connections.length === 0) {
        return res.status(404).json({ error: "No Google account connected" });
      }
      const events = await Promise.all(
        connections.map(async (connection) => {
          const events = await gmailService.getCalendarEvents(connection);
          return events;
        })
      );
      res.json({ events });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const connections = await storage.getGmailConnections(req.user!.id);
      if (!connections || connections.length === 0) {
        return res.status(404).json({ error: "No Google account connected" });
      }

      const event = await gmailService.createCalendarEvent(
        connections[0],
        req.body
      );
      res.json(event);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });

  // Interview feedback endpoints
  app.post("/api/interviews/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const interviewId = parseInt(req.params.id);
    if (isNaN(interviewId)) {
      return res.status(400).json({ error: "Invalid interview ID" });
    }

    try {
      const interview = await storage.getInterviewById(interviewId);
      if (!interview || interview.userId !== req.user!.id) {
        return res.status(404).json({ error: "Interview not found" });
      }

      // Handle video upload
      const videoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const feedback = await storage.createInterviewFeedback({
        interviewId,
        userId: req.user!.id,
        comments: req.body.comments,
        videoUrl,
        tags: JSON.parse(req.body.tags),
      });

      res.status(201).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/jobs/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { platform: platformId, params } = req.body;
      const platform = JOB_PLATFORMS.find((p) => p.id === platformId);

      if (!platform) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const jobs = await searchJobs(platform, params);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    const { title, description, date } = req.body;
    try {
      const newEvent = {
        title,
        description,
        date: new Date(date), // Ensure to handle the Date correctly
      };
      // Save the event to your database
      await db.createTimelineEvent(newEvent);
      res.status(201).send({ message: "Event created successfully!" });
    } catch (error) {
      console.error("Error saving event:", error);
      res.status(500).send({ error: "Failed to create event." });
    }
  });

  app.get("/api/gmail/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const connections = await storage.getGmailConnections(req.user!.id);
      if (!connections || connections.length === 0) {
        return res.status(404).json({ error: "No Gmail accounts connected" });
      }

      // Get emails from filtered accounts
      const allEmails = await Promise.all(
        connections.map(async (connection) => {
          const emails = await gmailService.getEmails(connection);
          return emails;
        })
      );

      // Flatten and deduplicate emails based on Message-ID
      const emailMap = new Map();
      allEmails.flat().forEach(email => {
        const key = email.messageId || email.id;
        if (!emailMap.has(key)) {
          emailMap.set(key, email);
        } else {
          // If we have a duplicate, keep the one with the most recent date
          const existingEmail = emailMap.get(key);
          if (new Date(email.date) > new Date(existingEmail.date)) {
            emailMap.set(key, email);
          }
        }
      });

      // Convert back to array and sort by date
      const emails = Array.from(emailMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Return both emails and available Gmail accounts
      res.json({
        emails,
        availableAccounts: connections.map(conn => ({
          email: conn.email,
          isSelected: true
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/applications/import", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Extract sheetId and gid from the full sheet URL
      const match = url.match(/\/d\/([^/]+).*?gid=(\d+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid Google Sheets URL" });
      }

      const [_, sheetId, gid] = match;
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        console.log("response", response.statusText);
        return res.status(400).json({ error: "Failed to fetch sheet data" });
      }

      const text = await response.text();
      const rows = text.split("\n").map((row) => row.split(","));

      // Skip header row and validate data
      const validApplications = [];
      const existingApplications = await storage.getApplicationsByUserId(
        req.user!.id
      );

      for (const row of rows.slice(1)) {
        const { columnMapping } = req.body;
        const date = row[columnMapping.date]?.replace(/['"]+/g, "");
        const skills = row[columnMapping.skills]
          ?.replace(/['"]+/g, "")
          .split(",")
          .map((s) => s.trim());
        const company = row[columnMapping.company]?.replace(/['"]+/g, "");
        const position = row[columnMapping.position]?.replace(/['"]+/g, "");
        const url = row[columnMapping.url]?.replace(/['"]+/g, "");
        const profile = row[columnMapping.profile]?.replace(/['"]+/g, "");

        // Basic validation
        if (!company || !position) continue;

        // Check for duplicates
        const isDuplicate = existingApplications.some(
          (app) =>
            app.company.toLowerCase() === company.toLowerCase() &&
            app.position.toLowerCase() === position.toLowerCase()
        );

        if (!isDuplicate) {
          validApplications.push({
            company,
            position,
            url,
            notes: `Skills: ${skills.join(", ")}\nProfile: ${row[6]?.replace(/['"]+/g, "")}`,
            appliedDate: date ? new Date(date) : new Date(),
            status: "applied",
            userId: req.user!.id,
          });
        }
      }

      // Insert valid applications in batches
      const batchSize = 5;
      const createdApplications = [];

      for (let i = 0; i < validApplications.length; i += batchSize) {
        const batch = validApplications.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((app) => storage.createApplication(app))
        );
        createdApplications.push(...results);
      }

      res.json({
        count: createdApplications.length,
        skipped: rows.length - 1 - validApplications.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import applications" });
    }
  });

  // Cleanup incorrect applications
  app.delete("/api/applications/cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Add validation of user existence
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const result = await storage.cleanupApplications(req.user!.id);
      res.json({ removedCount: result });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup applications" });
    }
  });

  app.get("/api/applications/others", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const position = req.query.position as string;
    if (!position) {
      return res.status(400).json({ error: "Position is required" });
    }

    try {
      const otherApplicants = await storage.getOtherApplicantsByPosition(
        req.user!.id,
        position
      );
      res.json(otherApplicants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch other applicants" });
    }
  });

  // Sheet Import Settings routes
  app.get("/api/sheet-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const settings = await storage.getSheetImportSettingsByUserId(
        req.user!.id
      );
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/sheet-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertSheetImportSettingsSchema.parse(userData);
      const setting = await storage.createSheetImportSettings(validatedData);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.put("/api/sheet-settings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const settingId = parseInt(req.params.id);
    if (isNaN(settingId)) {
      return res.status(400).json({ error: "Invalid setting ID" });
    }

    try {
      const setting = await storage.getSheetImportSettingsById(settingId);
      if (!setting || setting.userId !== req.user!.id) {
        return res.status(404).json({ error: "Setting not found" });
      }

      const updatedSetting = await storage.updateSheetImportSettings(
        settingId,
        req.body
      );
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.delete("/api/sheet-settings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const settingId = parseInt(req.params.id);
    if (isNaN(settingId)) {
      return res.status(400).json({ error: "Invalid setting ID" });
    }

    try {
      const setting = await storage.getSheetImportSettingsById(settingId);
      if (!setting || setting.userId !== req.user!.id) {
        return res.status(404).json({ error: "Setting not found" });
      }

      await storage.deleteSheetImportSettings(settingId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  // Profile endpoints
  app.get("/api/profiles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const profiles = await storage.getJobProfilesByUserId(req.user!.id);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const profileData = {
        ...req.body,
        userId: req.user!.id
      };
      const profile = await storage.createJobProfile(profileData);
      res.status(201).json(profile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const profileId = parseInt(req.params.id);
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    try {
      const profile = await storage.getJobProfileById(profileId);
      if (!profile || profile.userId !== req.user!.id) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const updatedProfile = await storage.updateJobProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const profileId = parseInt(req.params.id);
    if (isNaN(profileId)) {
      return res.status(400).json({ error: "Invalid profile ID" });
    }

    try {
      const profile = await storage.getJobProfileById(profileId);
      if (!profile || profile.userId !== req.user!.id) {
        return res.status(404).json({ error: "Profile not found" });
      }

      await storage.deleteJobProfile(profileId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
