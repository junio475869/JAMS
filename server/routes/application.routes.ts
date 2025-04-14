
import { Router } from 'express';
import * as applicationController from '../controllers/application.controller';
import { isAuthenticated } from '../middleware/auth.middleware';

const router = Router();

router.use(isAuthenticated);

router.get('/', applicationController.getApplications);
router.post('/', applicationController.createApplication);
router.get('/:id', applicationController.getApplicationById);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);

// Interview steps routes
router.get('/:id/interview-steps', applicationController.getInterviewSteps);
router.post('/:id/interview-steps', applicationController.createInterviewStep);
router.put('/:appId/interview-steps/:stepId', applicationController.updateInterviewStep);
router.delete('/:appId/interview-steps/:stepId', applicationController.deleteInterviewStep);

export default router;
