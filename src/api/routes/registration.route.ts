import { Router } from 'express';
import registrationController from '../controllers/registration.controller';
import { authenticate } from 'middlewares/authenticate';


const router = Router();

/**
 * @route POST /api/v1/registration/draft
 * @desc Save registration draft data
 * @access Private (requires authentication)
 */
router.post('/submit', authenticate, registrationController.submitDraft);

/**
 * @route GET /api/v1/registration
 * @desc Fetch user's registration data
 * @access Private (requires authentication)
 */
router.get('/:studentId', authenticate, registrationController.getRegistrationData);

export default router;