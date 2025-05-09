import { Router } from "express";
import { NotificationRepository } from "repository/notification.repository";
import { NotificationController } from 'controllers/notification.controller';
import { authenticate } from 'middlewares/authenticate';
import { validateBody, validateQuery } from 'middlewares/validate-request';
import { PaginationValidation } from "validations/pagination.validation";
import { NotificationValidation } from "validations/notification.validation";

const notificationRouter = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SYSTEM, ADMIN, DOCUMENT, APPLICATION]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [HIGH, NORMAL, LOW]
 *         description: Filter by priority
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.route('/')
    .get(authenticate, 
        validateQuery(PaginationValidation.paginationQuery), 
        notificationController.getNotifications)

/**
 * @swagger
 * /notifications/{recipientId}:
 *   post:
 *     summary: Send a notification to a specific user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the recipient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SYSTEM, ADMIN, DOCUMENT, APPLICATION]
 *               priority:
 *                 type: string
 *                 enum: [HIGH, NORMAL, LOW]
 *               metadata:
 *                 type: object
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [DATABASE, EMAIL, TELEGRAM]
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.post('/:recipientId', 
    authenticate, 
    validateBody(NotificationValidation.sendNotification),
    notificationController.sendNotification);

/**
 * @swagger
 * /notifications/broadcast:
 *   post:
 *     summary: Broadcast a notification to multiple users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientIds
 *               - payload
 *             properties:
 *               recipientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               payload:
 *                 type: object
 *                 required:
 *                   - title
 *                   - message
 *                 properties:
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [SYSTEM, ADMIN, DOCUMENT, APPLICATION]
 *                   priority:
 *                     type: string
 *                     enum: [HIGH, NORMAL, LOW]
 *                   metadata:
 *                     type: object
 *                   channels:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [DATABASE, EMAIL, TELEGRAM]
 *     responses:
 *       201:
 *         description: Notifications broadcast successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.post('/broadcast', authenticate, notificationController.broadcastNotification);

/**
 * @swagger
 * /notifications/mark-read:
 *   patch:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.post('/mark-read', authenticate, notificationController.markAsRead);

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Delete notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Notifications deleted successfully
 *       401:
 *         description: Unauthorized
 */
notificationRouter.delete('/:notificationId', authenticate, notificationController.deleteNotifications);

export default notificationRouter;