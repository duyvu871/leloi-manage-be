import { Request, Response } from 'express';
import AsyncMiddleware from 'util/async-handler';
import Success from 'server/responses/success-response/success';
import BadRequest from 'server/responses/client-errors/bad-request';
import { UnifiedNotificationService } from 'services/notification.service';
import { NotificationFilter, NotificationPayload } from 'server/common/interfaces/notification.service.interface';
import { PaginationQuery, PaginationValidation } from 'validations/pagination.validation';
import appConfig from 'server/configs/app.config';
import { transformExpressParamsForPrismaWithTimeRangeBase } from 'server/shared/helpers/pagination-parse';
import prisma from 'repository/prisma';
import { RecipientId, SendNotificationRequest } from 'validations/notification.validation';

export class NotificationController {
    private notificationService: UnifiedNotificationService;


    constructor() {
        // Initialize with configuration from environment
        this.notificationService = new UnifiedNotificationService({
            telegram: appConfig.telegramBotToken ? {
                botToken: appConfig.telegramBotToken,
                defaultRecipientId: appConfig.recipientId
            } : undefined,
            defaultChannels: ['DATABASE']
        });
    }

    /**
     * Send a notification to a specific user
     */
    sendNotification = AsyncMiddleware.asyncHandler(
        async (req: Request<RecipientId, {}, SendNotificationRequest, {}>, res: Response) => {
            try {
                const { recipientId } = req.params;
                const payload = req.body;
                const userId = req?.userId;

                if (!userId) {
                    console.error('Invalid user ID in sendNotification');
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }
                if (!recipientId) {
                    console.error('Missing recipient ID in sendNotification');
                    throw new BadRequest('INVALID_RECIPIENT_ID', 'Recipient ID is required', 'Recipient ID is required');
                }
                if (!payload) {
                    console.error('Missing notification payload in sendNotification');
                    throw new BadRequest('INVALID_PAYLOAD', 'Notification payload is required', 'Notification payload is required');
                }

                const result = await this.notificationService.sendNotification(recipientId, payload);
                const response = new Success(result).toJson;
                return res.status(201).json(response);
            } catch (error) {
                console.error('Error in sendNotification:', error);
                throw error;
            }
        }
    );

    /**
     * Get notifications for the current user
     */
    getNotifications = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
            try {
                const userId = req?.userId;
                if (!userId) {
                    console.error('Invalid user ID in getNotifications');
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const parsedQuery = transformExpressParamsForPrismaWithTimeRangeBase('notification', req.query, prisma);  

                const result = await this.notificationService.getNotifications(userId, parsedQuery);
                const paginationResponse = {
                    data: result.notifications,
                    page: Number(req.query.page),
                    total: result.total,
                    totalPages: Math.ceil(result.total / Number(req.query.pageSize)),
                }   
                const response = new Success(paginationResponse).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in getNotifications:', error);
                throw error;
            }
        }
    );

    /**
     * Mark notifications as read
     */
    markAsRead = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            try {
                const { notificationIds } = req.body;
                const userId = req?.userId;

                if (!userId) {
                    console.error('Invalid user ID in markAsRead');
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }
                if (!notificationIds || !Array.isArray(notificationIds)) {
                    console.error('Invalid notification IDs in markAsRead:', notificationIds);
                    throw new BadRequest('INVALID_NOTIFICATION_IDS', 'Notification IDs must be an array', 'Notification IDs must be an array');
                }

                await this.notificationService.markAsRead(notificationIds, userId);
                const response = new Success({ success: true }).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in markAsRead:', error);
                throw error;
            }
        }
    );

    /**
     * Delete notifications
     */
    deleteNotifications = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            try {
                const { notificationIds } = req.body;
                const userId = req?.userId;

                if (!userId) {
                    console.error('Invalid user ID in deleteNotifications');
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }
                if (!notificationIds || !Array.isArray(notificationIds)) {
                    console.error('Invalid notification IDs in deleteNotifications:', notificationIds);
                    throw new BadRequest('INVALID_NOTIFICATION_IDS', 'Notification IDs must be an array', 'Notification IDs must be an array');
                }

                await this.notificationService.deleteNotifications(notificationIds, userId);
                const response = new Success({ success: true }).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in deleteNotifications:', error);
                throw error;
            }
        }
    );

    /**
     * Broadcast notification to multiple users
     */
    broadcastNotification = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            try {
                const { recipientIds, payload } = req.body;
                const userId = req?.userId;

                if (!userId) {
                    console.error('Invalid user ID in broadcastNotification');
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }
                if (!recipientIds || !Array.isArray(recipientIds)) {
                    console.error('Invalid recipient IDs in broadcastNotification:', recipientIds);
                    throw new BadRequest('INVALID_RECIPIENT_IDS', 'Recipient IDs must be an array', 'Recipient IDs must be an array');
                }
                if (!payload) {
                    console.error('Missing notification payload in broadcastNotification');
                    throw new BadRequest('INVALID_PAYLOAD', 'Notification payload is required', 'Notification payload is required');
                }

                const result = await this.notificationService.broadcastNotification(recipientIds, payload);
                const response = new Success(result).toJson;
                return res.status(201).json(response);
            } catch (error) {
                console.error('Error in broadcastNotification:', error);
                throw error;
            }
        }
    );
} 