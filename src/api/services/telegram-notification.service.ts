import { NotificationService, NotificationPayload, NotificationSendOptions, TelegramNotificationConfig, NotificationFilter } from '../../common/interfaces/notification.service.interface';
import logger from '../../shared/utils/logger';
import { PrismaPaginationOptions } from 'server/shared/helpers/pagination-parse';
import { TelegramQueueService } from './telegram-queue.service';

/**
 * Telegram notification service that uses a queue to process messages
 * This service only enqueues messages, the actual sending is handled by the TelegramWorker
 */
export class TelegramNotificationService implements NotificationService {
    private queueService: TelegramQueueService;
    private config: TelegramNotificationConfig;

    constructor(config: TelegramNotificationConfig) {
        this.config = config;
        if (!this.config.botToken) {
            logger.error('Telegram Bot Token is not configured!');
            throw new Error('Telegram Bot Token is required.');
        }
        this.queueService = new TelegramQueueService(config);
        logger.info('Telegram Notification Service initialized (Queue-based)');
    }

    broadcastNotification(recipientIds: (string | number)[], payload: NotificationPayload, options?: NotificationSendOptions): Promise<{ success: boolean; details?: any; error?: any; }> {
        throw new Error('Method not implemented.');
    }
    
    markAsRead(notificationIds: number[], userId: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    
    getNotifications(userId: number, filter: PrismaPaginationOptions<'notification'>): Promise<{ notifications: any[]; total: number; }> {
        throw new Error('Method not implemented.');
    }
    
    deleteNotifications(notificationIds: number[], userId: number): Promise<void> {
        throw new Error('Method not implemented.');
    }

    /**
     * Send a notification by adding it to the queue
     */
    public async sendNotification(
        recipientId: string,
        payload: NotificationPayload,
        options?: NotificationSendOptions & { parseMode?: 'MarkdownV2' | 'HTML' },
        userId?: string | number
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        return this.queueService.sendNotification(recipientId, payload, options, userId);
    }

    /**
     * Close the queue service
     */
    public async close(): Promise<void> {
        try {
            await this.queueService.close();
            logger.info('Telegram Notification Service closed');
        } catch (error) {
            logger.error('Error closing Telegram Notification Service:', error);
            throw error;
        }
    }
}

// Cách sử dụng ví dụ (bạn sẽ tích hợp vào service/controller của mình):
// (async () => {
//     if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
//         const telegramConfig: TelegramNotificationConfig = {
//             botToken: process.env.TELEGRAM_BOT_TOKEN,
//         };
//         const telegramService = new TelegramNotificationService(telegramConfig);
//
//         const result = await telegramService.sendNotification(
//             process.env.TELEGRAM_CHAT_ID, 
//             { message: 'Hello from *Telegraf*! This is a test notification.' },
//             { parseMode: 'MarkdownV2' }
//         );
//
//         if (result.success) {
//             console.log('Telegram notification sent successfully:', result.details);
//         } else {
//             console.error('Failed to send Telegram notification:', result.error);
//         }
//     } else {
//         console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables are not set. Skipping test send.');
//     }
// })(); 