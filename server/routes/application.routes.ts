import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { ApplicationStatus } from '@shared/schema';
import { db } from '../utils/db';
import { ApplicationModel } from '../models/application.model';

const router = Router();

// Get applications with pagination
router.get('/', async (req, res) => {
  res.json({ message: "Hello, world!" });
  return;
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as typeof ApplicationStatus[keyof typeof ApplicationStatus];
    const searchTerm = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await ApplicationController.getApplicationsByUserIdPaginated(
      userId,
      page,
      pageSize,
      status,
      searchTerm,
      sortBy,
      sortOrder
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/:id', async (req, res) => {
  try {
    const application = await ApplicationController.getApplicationById(parseInt(req.params.id));
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create application
router.post('/', async (req, res) => {
  try {
    const application = await ApplicationController.createApplication({
      userId: req.user.id,
      company: req.body.company,
      position: req.body.position,
      status: req.body.status as typeof ApplicationStatus[keyof typeof ApplicationStatus],
      appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : undefined,
      notes: req.body.notes,
      description: req.body.description,
      url: req.body.url,
    });
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application
router.put('/:id', async (req, res) => {
  try {
    const application = await ApplicationController.updateApplication(parseInt(req.params.id), {
      company: req.body.company,
      position: req.body.position,
      status: req.body.status as typeof ApplicationStatus[keyof typeof ApplicationStatus],
      appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : undefined,
      notes: req.body.notes,
      description: req.body.description,
      url: req.body.url,
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    await ApplicationController.deleteApplication(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Cleanup applications
router.delete('/cleanup', async (req, res) => {
  try {
    await ApplicationController.cleanupApplications(req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error cleaning up applications:', error);
    res.status(500).json({ error: 'Failed to cleanup applications' });
  }
});

export default router; 