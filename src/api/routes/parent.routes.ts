import { Router } from 'express';
import { ParentController } from 'controllers/parent.controller';
import { authenticate } from 'middlewares/authenticate';
import { upload } from 'middlewares/file-validation.middleware';

const parentRouter = Router();
const parentController = new ParentController();

/**
 * @swagger
 * /parent/student:
 *   post:
 *     summary: Add a new student
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - dateOfBirth
 *               - gender
 *               - schoolOrigin
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               schoolOrigin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student added successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
parentRouter.post('/student', authenticate, parentController.addStudent);

/**
 * @swagger
 * /parent/students:
 *   get:
 *     summary: Get list of students for current parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
parentRouter.get('/students', authenticate, parentController.getStudents);

/**
 * @swagger
 * /parent/student/{studentId}:
 *   get:
 *     summary: Get student details by ID
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the student
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *       400:
 *         description: Invalid student ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Student not found
 */
parentRouter.get('/student/:studentId', authenticate, parentController.getStudentById);

/**
 * @swagger
 * /parent/application:
 *   post:
 *     summary: Create a new application
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Invalid request data or student already has an application
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Student not found
 */
parentRouter.post('/application', authenticate, parentController.createApplication);

/**
 * @swagger
 * /parent/applications:
 *   get:
 *     summary: Get list of applications
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
parentRouter.get('/applications', authenticate, parentController.getApplications);

/**
 * @swagger
 * /parent/application/{applicationId}:
 *   get:
 *     summary: Get application details by ID
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the application
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 *       400:
 *         description: Invalid application ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Application not found
 */
parentRouter.get('/application/:applicationId', authenticate, parentController.getApplicationById);

/**
 * @swagger
 * /parent/application/document:
 *   post:
 *     summary: Upload document for application
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - applicationId
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               applicationId:
 *                 type: integer
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Application not found
 */
parentRouter.post(
	'/application/document',
	authenticate,
	upload.single('file'),
	parentController.uploadDocument,
);

/**
 * @swagger
 * /parent/schedules:
 *   get:
 *     summary: Get available schedules
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available schedules retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
parentRouter.get('/schedules', authenticate, parentController.getSchedules);

/**
 * @swagger
 * /parent/schedule/book:
 *   post:
 *     summary: Book a schedule slot
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - scheduleSlotId
 *             properties:
 *               applicationId:
 *                 type: integer
 *               scheduleSlotId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Schedule slot booked successfully
 *       400:
 *         description: Invalid request data or schedule slot not available
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Application or schedule slot not found
 */
parentRouter.post('/schedule/book', authenticate, parentController.bookSchedule);

export default parentRouter;
