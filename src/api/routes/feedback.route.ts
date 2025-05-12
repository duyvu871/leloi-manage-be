import { Router } from 'express';
import feedbackController from 'controllers/feedback.controller';
import { createFeedbackSchema, updateFeedbackStatusSchema, feedbackIdSchema, feedbackQuerySchema } from 'validations/feedback.validation';
import { validateBody, validateParams, validateQuery } from 'middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

/**
 * @route POST /api/v1/feedback
 * @desc Submit a new feedback
 * @access Private
 */
router.post('/',
    authenticate,
    validateBody(createFeedbackSchema),
    feedbackController.submitFeedback
);

/**
 * @route GET /api/v1/feedback
 * @desc Get feedback list with filters
 * @access Private
 */
router.get('/',
    authenticate,
    validateQuery(feedbackQuerySchema),
    feedbackController.getFeedbackList
);

/**
 * @route PATCH /api/v1/feedback/:id/status
 * @desc Update feedback status
 * @access Private
 */
router.patch('/:id/status',
    authenticate,
    validateParams(feedbackIdSchema),
    validateBody(updateFeedbackStatusSchema),
    feedbackController.updateFeedbackStatus
);

export default router; 