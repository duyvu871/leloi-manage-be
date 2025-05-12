import { Router } from 'express';
import adminController from 'controllers/admin.controller';
import { validateBody, validateParams, validateQuery } from 'middlewares/validate-request';
import { authenticate } from 'middlewares/authenticate';
import { 
    studentIdSchema, 
    studentFilterSchema, 
    updateStudentStatusSchema,
    updateStudentInfoSchema
} from 'validations/admin.validation';
import { checkRole } from 'middlewares/check-role';

const router = Router();

/**
 * Base route requires admin authentication
 */
router.use(
    authenticate, 
    // checkRole(['admin'])
);

/**
 * @route GET /api/v1/admin/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route GET /api/v1/admin/stats/detailed
 * @desc Get detailed statistics
 * @access Private (Admin)
 */
router.get('/stats/detailed', adminController.getDetailedStats);

/**
 * @route GET /api/v1/admin/students
 * @desc Get paginated list of students
 * @access Private (Admin)
 */
router.get('/students', 
    validateQuery(studentFilterSchema),
    adminController.listStudents
);

/**
 * @route GET /api/v1/admin/students/:id
 * @desc Get detailed information about a student
 * @access Private (Admin)
 */
router.get('/students/:id',
    validateParams(studentIdSchema),
    adminController.getStudentDetails
);

/**
 * @route PATCH /api/v1/admin/students/:id/status
 * @desc Update a student's status
 * @access Private (Admin)
 */
router.patch('/students/:id/status',
    validateParams(studentIdSchema),
    validateBody(updateStudentStatusSchema),
    adminController.updateStudentStatus
);

/**
 * @route GET /api/v1/admin/pending
 * @desc Get pending review students
 * @access Private (Admin)
 */
router.get('/pending', adminController.getPendingReviewStudents);

/**
 * @route GET /api/v1/admin/verify
 * @desc Verify a student by ID
 * @access Private (Admin)
 */
router.get('/verify', adminController.verifyStudentById);

/**
 * @route PATCH /api/v1/admin/students/:id
 * @desc Update student information
 * @access Private (Admin)
 */
router.patch('/students/:id',
    validateParams(studentIdSchema),
    validateBody(updateStudentInfoSchema),
    adminController.updateStudentInfo
);

/**
 * @route GET /api/v1/admin/students/:id/documents
 * @desc Get student documents
 * @access Private (Admin)
 */
router.get('/students/:id/documents',
    validateParams(studentIdSchema),
    adminController.getStudentDocuments
);

export default router; 