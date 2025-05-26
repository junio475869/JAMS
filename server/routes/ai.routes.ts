import { Router } from 'express';
import { storage } from '../storage';
import { DocumentType } from '@shared/schema';
import { z } from 'zod';
import {
  generateCoverLetter,
  analyzeResume,
  generateInterviewQuestions,
  generateResponseToQuestion,
  analyzeInterviewTranscript,
  generateInterviewFeedback,
  createMockInterview,
  analyzeApplicationStatus,
} from '../utils/ai';

const router = Router();

// Generate cover letter
router.post('/cover-letter', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    jobDescription: z.string(),
    resumeId: z.number().optional(),
    company: z.string(),
    position: z.string(),
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
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Analyze resume
router.post('/resume-analysis', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    resumeId: z.number(),
    jobDescription: z.string(),
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
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Generate interview questions
router.post('/interview-questions', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    jobDescription: z.string(),
    position: z.string(),
    company: z.string(),
  });

  try {
    const { jobDescription, position, company } = schema.parse(req.body);
    const questions = await generateInterviewQuestions(jobDescription, position, company);
    res.json({ questions });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Generate interview answer
router.post('/interview-answer', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    question: z.string(),
    resumeId: z.number().optional(),
    framework: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    tone: z.string().optional(),
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

    const answer = await generateResponseToQuestion(question, resumeContent, framework, keywords, tone);
    res.json({ answer });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Generate interview feedback
router.post('/interview-feedback', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    questions: z.array(z.string()),
    answers: z.array(z.string()),
    position: z.string(),
  });

  try {
    const { questions, answers, position } = schema.parse(req.body);
    const feedback = await generateInterviewFeedback(questions, answers, position);
    res.json({ feedback });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Create mock interview
router.post('/mock-interview', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    position: z.string(),
    company: z.string(),
    level: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
  });

  try {
    const { position, company, level, focusAreas } = schema.parse(req.body);
    const mockInterview = await createMockInterview(position, company, level, focusAreas);
    res.json(mockInterview);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Analyze interview transcript
router.post('/interview-transcript-analysis', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const schema = z.object({
    transcript: z.string(),
    jobDescription: z.string(),
    position: z.string(),
  });

  try {
    const { transcript, jobDescription, position } = schema.parse(req.body);
    const analysis = await analyzeInterviewTranscript(transcript, jobDescription, position);
    res.json({ analysis });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

// Analyze application status
router.post('/application-status-analysis', async (req, res) => {
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
    const timelineEvents = await storage.getTimelineEventsByApplicationId(applicationId);
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
    const safeApplication = {
      company: application.company,
      position: application.position,
      status: application.status,
      appliedDate: application.appliedDate,
      notes: application.notes,
      description: application.description,
    };

    const colorAnalysis = await analyzeApplicationStatus(safeApplication, statusHistory);
    res.json({ colorAnalysis });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: errorMessage });
  }
});

export default router; 