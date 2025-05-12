import { Router } from 'express';
import registrationController from 'controllers/registration.controller';
import { authenticate } from 'middlewares/authenticate';
import { validateBody, validateParams } from 'middlewares/validate-request';
import { registrationApiSchema, studentIdParam } from 'validations/registration.validation';


const router = Router();

/**
 * @route GET /api/v1/registration/:studentId
 * @desc Fetch user's registration data
 * @access Private (requires authentication)
 */
router.get('/:studentId', 
    authenticate, 
    validateParams(studentIdParam),
    registrationController.getRegistrationData);

/**
 * @route POST /api/v1/registration/draft
 * @desc Save registration draft data
 * @access Private (requires authentication)
 */
router.post('/submit', 
    authenticate, 
    validateBody(registrationApiSchema),
    registrationController.submitDraft);

export default router;