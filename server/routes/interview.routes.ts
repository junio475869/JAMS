import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { db } from '../utils/db';
import { InterviewModel } from '../models/interview.model';

const router = Router();
const interviewController = new InterviewController();

// Get interviews
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const interviews = await interviewController.getInterviewsByUserId(userId);
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get single interview
router.get('/:id', async (req, res) => {
  try {
    const interview = await interviewController.getInterviewById(parseInt(req.params.id));
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Create interview
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const interview = await interviewController.createInterview({
      userId,
      applicationId: req.body.applicationId,
      type: req.body.type,
      title: req.body.title,
      company: req.body.company,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      notes: req.body.notes,
    });
    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', async (req, res) => {
  try {
    const interview = await interviewController.updateInterview(parseInt(req.params.id), {
      type: req.body.type,
      title: req.body.title,
      company: req.body.company,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      notes: req.body.notes,
    });
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:id', async (req, res) => {
  try {
    await interviewController.deleteInterview(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// Get interview steps
router.get('/:applicationId/steps', async (req, res) => {
  try {
    const steps = await interviewController.getInterviewStepsByApplicationId(
      parseInt(req.params.applicationId)
    );
    res.json(steps);
  } catch (error) {
    console.error('Error fetching interview steps:', error);
    res.status(500).json({ error: 'Failed to fetch interview steps' });
  }
});

// Create interview step
router.post('/:applicationId/steps', async (req, res) => {
  try {
    const step = await interviewController.createInterviewStep({
      applicationId: parseInt(req.params.applicationId),
      stepName: req.body.stepName,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
      completed: req.body.completed,
      interviewerName: req.body.interviewerName,
      notes: req.body.notes,
    });
    res.status(201).json(step);
  } catch (error) {
    console.error('Error creating interview step:', error);
    res.status(500).json({ error: 'Failed to create interview step' });
  }
});

// Update interview step
router.put('/steps/:id', async (req, res) => {
  try {
    const step = await interviewController.updateInterviewStep(parseInt(req.params.id), {
      stepName: req.body.stepName,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
      completed: req.body.completed,
      interviewerName: req.body.interviewerName,
      notes: req.body.notes,
    });
    if (!step) {
      return res.status(404).json({ error: 'Interview step not found' });
    }
    res.json(step);
  } catch (error) {
    console.error('Error updating interview step:', error);
    res.status(500).json({ error: 'Failed to update interview step' });
  }
});

// Delete interview step
router.delete('/steps/:id', async (req, res) => {
  try {
    await interviewController.deleteInterviewStep(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview step:', error);
    res.status(500).json({ error: 'Failed to delete interview step' });
  }
});

export default router; 