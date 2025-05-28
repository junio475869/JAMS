import { Router } from "express";
import { InterviewPrepModel } from "../models/interview-prep.model";

const router = Router();
const interviewPrepModel = new InterviewPrepModel();

// Get all interview prep questions
router.get("/questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const questions = await interviewPrepModel.findQuestions(req.user.id);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Create a new interview prep question
router.post("/questions", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const question = await interviewPrepModel.createQuestion({
      userId: req.user.id,
      ...req.body,
    });
    res.json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// Update an interview prep question
router.put("/questions/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const question = await interviewPrepModel.updateQuestion(
      parseInt(req.params.id),
      req.body
    );
    res.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete an interview prep question
router.delete("/questions/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    await interviewPrepModel.deleteQuestion(parseInt(req.params.id));
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// Get all mock interviews
router.get("/mock-interviews", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const interviews = await interviewPrepModel.findMockInterviews(req.user.id);
    res.json(interviews);
  } catch (error) {
    console.error("Error fetching mock interviews:", error);
    res.status(500).json({ error: "Failed to fetch mock interviews" });
  }
});

// Create a new mock interview
router.post("/mock-interviews", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const interview = await interviewPrepModel.createMockInterview({
      userId: req.user.id,
      ...req.body,
    });
    res.json(interview);
  } catch (error) {
    console.error("Error creating mock interview:", error);
    res.status(500).json({ error: "Failed to create mock interview" });
  }
});

// Update a mock interview
router.put("/mock-interviews/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const interview = await interviewPrepModel.updateMockInterview(
      parseInt(req.params.id),
      req.body
    );
    res.json(interview);
  } catch (error) {
    console.error("Error updating mock interview:", error);
    res.status(500).json({ error: "Failed to update mock interview" });
  }
});

// Delete a mock interview
router.delete("/mock-interviews/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    await interviewPrepModel.deleteMockInterview(parseInt(req.params.id));
    res.json({ message: "Mock interview deleted successfully" });
  } catch (error) {
    console.error("Error deleting mock interview:", error);
    res.status(500).json({ error: "Failed to delete mock interview" });
  }
});

// Get all AI responses
router.get("/ai-responses", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const responses = await interviewPrepModel.findAIResponses(req.user.id);
    res.json(responses);
  } catch (error) {
    console.error("Error fetching AI responses:", error);
    res.status(500).json({ error: "Failed to fetch AI responses" });
  }
});

// Create a new AI response
router.post("/ai-responses", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const response = await interviewPrepModel.createAIResponse({
      userId: req.user.id,
      ...req.body,
    });
    res.json(response);
  } catch (error) {
    console.error("Error creating AI response:", error);
    res.status(500).json({ error: "Failed to create AI response" });
  }
});

// Delete an AI response
router.delete("/ai-responses/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    await interviewPrepModel.deleteAIResponse(parseInt(req.params.id));
    res.json({ message: "AI response deleted successfully" });
  } catch (error) {
    console.error("Error deleting AI response:", error);
    res.status(500).json({ error: "Failed to delete AI response" });
  }
});

export default router;
