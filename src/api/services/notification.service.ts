import { PrismaClient } from '@prisma/client';
import { TelegramNotificationService } from './telegram-notification.service';
import { EmailNotificationService } from './email-notification.service';
import {
    NotificationService as INotificationService,
    NotificationPayload,
    NotificationSendOptions,
    NotificationFilter,
    NotificationServiceConfig,
    NotificationChannel
} from 'server/common/interfaces/notification.service.interface';
import logger from 'util/logger';
import prisma from 'repository/prisma';
import { ServiceResponse } from "responses/services-response/base";
import { PrismaPaginationOptions } from 'server/shared/helpers/pagination-parse';
import { Notification } from '@prisma/client';

export class UnifiedNotificationService implements INotificationService {
    private telegramService?: TelegramNotificationService;
    private emailService?: EmailNotificationService;
    private defaultChannels: NotificationChannel[];
    private config: NotificationServiceConfig;

    constructor(config: NotificationServiceConfig) {
        this.config = config;
        // Initialize notification channels based on config
        if (config.telegram) {
            this.telegramService = new TelegramNotificationService(config.telegram);
        }
        if (config.email) {
            this.emailService = new EmailNotificationService();
        }
        this.defaultChannels = config.defaultChannels || ['DATABASE'];
    }

    async sendNotification(
        recipientId: string | number,
        payload: NotificationPayload,
        options?: NotificationSendOptions
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        try {
            const channels = payload.channels || this.defaultChannels;
            const results: { channel: string; success: boolean; details?: any; error?: any }[] = [];

            // If there is an error, only send to Telegram
            if (payload.metadata?.error) {
                if (this.telegramService) {
                    try {
                        const telegramResult = await this.telegramService.sendNotification(
                            String(this.config.telegram?.defaultRecipientId || recipientId),
                            payload,
                            options
                        );
                        results.push({ channel: 'TELEGRAM', ...telegramResult });
                    } catch (error) {
                        logger.error('Telegram notification failed:', error);
                        results.push({ channel: 'TELEGRAM', success: false, error });
                    }
                }
            } else {
                // No error - proceed with all configured channels

                // Store in database if DATABASE channel is specified
                if (channels.includes('DATABASE')) {
                    const dbResult = await this.storeNotification(Number(recipientId), payload);
                    results.push({ channel: 'DATABASE', success: true, details: dbResult });
                }

                // Send via Telegram if configured and requested
                if (channels.includes('TELEGRAM') && this.telegramService) {
                    try {
                        const telegramResult = await this.telegramService.sendNotification(
                            String(this.config.telegram?.defaultRecipientId || recipientId),
                            payload,
                            options
                        );
                        results.push({ channel: 'TELEGRAM', ...telegramResult });
                    } catch (error) {
                        logger.error('Telegram notification failed:', error);
                        results.push({ channel: 'TELEGRAM', success: false, error });
                    }
                }

                // Send via Email if configured and requested
                if (channels.includes('EMAIL') && this.emailService) {
                    try {
                        const emailResult = await this.emailService.sendNotification(
                            recipientId,
                            payload,
                            options
                        );
                        results.push({ channel: 'EMAIL', ...emailResult });
                    } catch (error) {
                        logger.error('Email notification failed:', error);
                        results.push({ channel: 'EMAIL', success: false, error });
                    }
                }
            }

            // Consider the overall operation successful if at least one channel succeeded
            const success = results.some(r => r.success);
            return { success, details: results };
        } catch (error) {
            logger.error('Notification sending failed:', error);
            return { success: false, error };
        }
    }

    async broadcastNotification(
        recipientIds: (string | number)[],
        payload: NotificationPayload,
        options?: NotificationSendOptions
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        const results = await Promise.all(
            recipientIds.map(recipientId =>
                this.sendNotification(recipientId, payload, options)
            )
        );

        const success = results.some(r => r.success);
        return {
            success,
            details: results
        };
    }

    async markAsRead(notificationIds: number[], userId: number): Promise<void> {
        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: userId
            },
            data: {
                isRead: true
            }
        });
    }

    async getNotifications(userId: number, filter: PrismaPaginationOptions<'notification'>): Promise<{ notifications: Notification[]; total: number }> {
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                ...filter,
                where: {
                    userId: userId,
                    ...filter.where
                },
            }),
            prisma.notification.count({
                where: {
                    userId: userId,
                    ...filter.where
                },
            }),
        ]);

        return { notifications, total };
    }

    async deleteNotifications(notificationIds: number[], userId: number): Promise<void> {
        await prisma.notification.deleteMany({
            where: {
                id: { in: notificationIds },
                userId: userId
            }
        });
    }

    private async storeNotification(userId: number, payload: NotificationPayload): Promise<any> {
        return await prisma.notification.create({
            data: {
                userId,
                title: payload.title,   
                content: payload.message,
                htmlContent: payload.htmlContent,
                description: payload.description,
                type: payload.type || 'SYSTEM',
                priority: payload.priority || 'NORMAL',
                isRead: false,
                metadata: payload.metadata || {},
                sentVia: payload.channels || this.defaultChannels
            }
        });
    }

    /**
     * Close all notification service connections
     */
    public async close(): Promise<void> {
        try {
            // Close any active connections or cleanup resources
            if (this.telegramService) {
                await this.telegramService.close();
            }
            // Add any other cleanup needed for other notification channels
        } catch (error) {
            logger.error('Error closing notification service:', error);
            throw error;
        }
    }
}

export default class NotificationService {
    async createNotification(userId: number, type: string, title: string, content: string): Promise<ServiceResponse> {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    content,
                    isRead: false
                }
            });
            return { success: true, data: notification };
        } catch (error) {
            return { success: false, error: 'Failed to create notification' };
        }
    }

    async markAsRead(notificationId: number): Promise<ServiceResponse> {
        try {
            const notification = await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true, readAt: new Date() }
            });
            return { success: true, data: notification };
        } catch (error) {
            return { success: false, error: 'Failed to mark notification as read' };
        }
    }

    async getUserNotifications(userId: number): Promise<ServiceResponse> {
        try {
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            return { success: true, data: notifications };
        } catch (error) {
            return { success: false, error: 'Failed to fetch notifications' };
        }
    }
}