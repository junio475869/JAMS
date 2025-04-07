import type { Express } from "express";
// Error handling type for better error messages
type ApiError = Error | { message?: string };
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
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
  StatusColorAnalysis
} from "./ai";
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
  InterviewQuestionDifficulty
} from "@shared/schema";
import { db } from "./db";
import { gmailService } from "./gmail-service"; // Added import

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Sets up team management routes
  setupTeamRoutes(app);

  // Application endpoints
  app.get("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applications = await storage.getApplicationsByUserId(req.user!.id);
    res.json(applications);
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
        type: "application"
      });

      res.status(201).json(application);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
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

  app.patch("/api/applications/:id", async (req, res) => {
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
      const updatedApplication = await storage.updateApplication(applicationId, req.body);

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
          type: eventType
        });
      }

      res.json(updatedApplication);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
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
      res.status(400).json({ error: error.message || "Invalid request" });
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
      const updatedDocument = await storage.updateDocument(documentId, updatedData);
      res.json(updatedDocument);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
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

    const interviews = await storage.getInterviewsByUserId(req.user!.id);
    res.json(interviews);
  });

  app.post("/api/interviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertInterviewSchema.parse(userData);

      // Check that the application belongs to the user
      const application = await storage.getApplicationById(validatedData.applicationId);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      const interview = await storage.createInterview(validatedData);

      // Create a timeline event for this interview
      await storage.createTimelineEvent({
        applicationId: validatedData.applicationId,
        userId: req.user!.id,
        title: "Interview Scheduled",
        description: `${interview.type} interview scheduled for ${interview.title} at ${interview.company}`,
        type: "interview"
      });

      res.status(201).json(interview);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
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
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  // Timeline endpoints
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

    const timeline = await storage.getTimelineEventsByApplicationId(applicationId);
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
      res.status(400).json({ error: error.message || "Invalid request" });
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
      position: z.string()
    });

    try {
      const { jobDescription, resumeId, company, position } = schema.parse(req.body);

      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (resume && resume.userId === req.user!.id && resume.type === DocumentType.RESUME) {
          resumeContent = resume.content;
        }
      }

      const coverLetter = await generateCoverLetter(jobDescription, resumeContent, company, position);

      res.json({ coverLetter });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/ai/resume-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      resumeId: z.number(),
      jobDescription: z.string()
    });

    try {
      const { resumeId, jobDescription } = schema.parse(req.body);

      const resume = await storage.getDocumentById(resumeId);
      if (!resume || resume.userId !== req.user!.id || resume.type !== DocumentType.RESUME) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const analysis = await analyzeResume(resume.content, jobDescription);

      res.json({ analysis });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  // Application Status Visualization endpoint
  app.post("/api/ai/application-status-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      applicationId: z.number()
    });

    try {
      const { applicationId } = schema.parse(req.body);

      // Get the application
      const application = await storage.getApplicationById(applicationId);
      if (!application || application.userId !== req.user!.id) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Get timeline events for status history
      const timelineEvents = await storage.getTimelineEventsByApplicationId(applicationId);
      const statusHistory = timelineEvents
        .filter(event => event.title.includes("Status") || event.type === "application" || 
                event.type === "interview" || event.type === "offer" || event.type === "rejection")
        .map(event => ({
          status: event.title.includes("Status") ? event.description.split("to ")[1] : 
                 event.type === "application" ? "applied" :
                 event.type === "interview" ? "interview" :
                 event.type === "offer" ? "offer" :
                 event.type === "rejection" ? "rejected" : "unknown",
          date: event.date
        }));

      // Call the AI to analyze the application status
      // Ensure we handle null values for date fields
      const safeApplication = {
        company: application.company,
        position: application.position,
        status: application.status,
        appliedDate: application.appliedDate,
        notes: application.notes,
        description: application.description
      };

      const colorAnalysis = await analyzeApplicationStatus(safeApplication, statusHistory);

      res.json({ colorAnalysis });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid request";
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
      difficulty: req.query.difficulty as string | undefined
    };

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

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
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/interview-questions/:id/vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const questionId = parseInt(req.params.id);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const schema = z.object({
      isUpvote: z.boolean()
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
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  // Interview Assistance endpoints
  app.get("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const assistances = await storage.getInterviewAssistanceByUserId(req.user!.id);
    res.json(assistances);
  });

  app.post("/api/interview-assistance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userData = { ...req.body, userId: req.user!.id };
      const validatedData = insertInterviewAssistanceSchema.parse(userData);

      // Check that the interview belongs to the user if provided
      if (validatedData.interviewId) {
        const interview = await storage.getInterviewById(validatedData.interviewId);
        if (!interview || interview.userId !== req.user!.id) {
          return res.status(404).json({ error: "Interview not found" });
        }
      }

      const assistance = await storage.createInterviewAssistance(validatedData);
      res.status(201).json(assistance);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  // AI Interview endpoints
  app.post("/api/ai/interview-questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      jobDescription: z.string(),
      position: z.string(),
      company: z.string()
    });

    try {
      const { jobDescription, position, company } = schema.parse(req.body);

      const questions = await generateInterviewQuestions(jobDescription, position, company);

      res.json({ questions });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/ai/interview-answer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      question: z.string(),
      resumeId: z.number().optional(),
      framework: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      tone: z.string().optional()
    });

    try {
      const { question, resumeId, framework, keywords, tone } = schema.parse(req.body);

      let resumeContent = "";
      if (resumeId) {
        const resume = await storage.getDocumentById(resumeId);
        if (resume && resume.userId === req.user!.id && resume.type === DocumentType.RESUME) {
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
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/ai/interview-feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      questions: z.array(z.string()),
      answers: z.array(z.string()),
      position: z.string()
    });

    try {
      const { questions, answers, position } = schema.parse(req.body);

      const feedback = await generateInterviewFeedback(questions, answers, position);

      res.json({ feedback });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/ai/mock-interview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      position: z.string(),
      company: z.string(),
      level: z.string().optional(),
      focusAreas: z.array(z.string()).optional()
    });

    try {
      const { position, company, level, focusAreas } = schema.parse(req.body);

      const mockInterview = await createMockInterview(position, company, level, focusAreas);

      res.json(mockInterview);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.post("/api/ai/interview-transcript-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const schema = z.object({
      transcript: z.string(),
      jobDescription: z.string(),
      position: z.string()
    });

    try {
      const { transcript, jobDescription, position } = schema.parse(req.body);

      const analysis = await analyzeInterviewTranscript(transcript, jobDescription, position);

      res.json({ analysis });
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  // Gmail endpoints (placeholders)
  app.get("/api/gmail/inbox", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const emails = await gmailService.getInboxEmails(req.user!.id); // Placeholder function call
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}