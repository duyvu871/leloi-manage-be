import {
    NotificationService,
    NotificationPayload,
    NotificationSendOptions,
    NotificationFilter
} from 'server/common/interfaces/notification.service.interface';
import EmailService from './email.service';
import { EmailTemplateService } from './email-template.service';
import logger from 'util/logger';
import prisma from 'repository/prisma';

export class EmailNotificationService implements NotificationService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    async sendNotification(
        recipientId: string | number,
        payload: NotificationPayload,
        options?: NotificationSendOptions
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        try {
            // If recipientId is a number (user ID), get the user's email
            let recipientEmail = String(recipientId);
            if (!recipientEmail.includes('@')) {
                const user = await prisma.user.findUnique({
                    where: { id: Number(recipientId) },
                    select: { 
                        email: true,
                        students: {
                            select: {
                                registration: {
                                    select: {
                                        fullName: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (!user) {
                    throw new Error(`User not found with ID: ${recipientId}`);
                }
                recipientEmail = user.email;

                // If this is a document notification, use the document template
                if (payload.type === 'DOCUMENT' && payload.metadata?.documentType) {
                    const templateData = {
                        studentName: user.students?.[0]?.registration?.fullName || 'Unknown',
                        jobId: payload.metadata.jobId,
                        documentType: payload.metadata.documentType,
                        error: payload.metadata.error
                    };

                    const emailContent = payload.metadata.error 
                        ? EmailTemplateService.documentError(templateData)
                        : EmailTemplateService.documentProcessed(templateData);

                    const success = await this.emailService.sendEmail({
                        to: recipientEmail,
                        subject: emailContent.subject,
                        text: emailContent.text,
                        html: emailContent.html
                    });

                    return {
                        success,
                        details: success ? { recipient: recipientEmail, template: 'document' } : undefined,
                        error: success ? undefined : 'Failed to send email'
                    };
                }
            }

            // For other notifications, use the default template
            const emailContent = EmailTemplateService.fromNotificationPayload(payload);

            // Send the email
            const success = await this.emailService.sendEmail({
                to: recipientEmail,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            });

            return {
                success,
                details: success ? { recipient: recipientEmail, template: 'default' } : undefined,
                error: success ? undefined : 'Failed to send email'
            };
        } catch (error) {
            logger.error('Email notification failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
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
        const details = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };

        return { success, details };
    }

    async markAsRead(): Promise<void> {
        // Email notifications don't have a read status
        return;
    }

    async getNotifications(): Promise<{ notifications: any[]; total: number }> {
        // Email notifications are not stored
        return { notifications: [], total: 0 };
    }

    async deleteNotifications(): Promise<void> {
        // Email notifications cannot be deleted
        return;
    }
} 