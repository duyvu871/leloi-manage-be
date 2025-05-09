import { Queue } from 'bullmq';
import logger from 'util/logger';
import appConfig from 'server/configs/app.config';
import { NotificationPayload, NotificationSendOptions, TelegramNotificationConfig } from 'server/common/interfaces/notification.service.interface';

export interface TelegramQueueMessageData {
    recipientId: string;
    payload: NotificationPayload;
    options?: NotificationSendOptions & { parseMode?: 'MarkdownV2' | 'HTML' };
    userId?: string | number;
}

/**
 * Service responsible for enqueueing Telegram messages to be processed by a separate worker
 */
export class TelegramQueueService {
    private queue: Queue;
    private config: TelegramNotificationConfig;

    constructor(config: TelegramNotificationConfig) {
        this.config = config;
        
        if (!this.config.botToken) {
            logger.error('Telegram Bot Token is not configured!');
            throw new Error('Telegram Bot Token is required.');
        }

        // Initialize queue
        const redisConnection = {
            host: appConfig.redisHost || 'localhost',
            port: appConfig.redisPort || 6379
        };

        this.queue = new Queue('telegram-notifications', {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 3, // Number of attempts to send the message
                backoff: {
                    type: 'exponential', // Use exponential backoff
                    delay: 5000 // Initial delay of 5 seconds
                },
                removeOnComplete: true, // Remove the job from the queue after it's processed
                removeOnFail: true // Remove the job from the queue if it fails after the maximum number of attempts
            }
        });

        logger.info('Telegram Queue Service initialized');
    }

    /**
     * Enqueue a message to be sent via Telegram
     */
    public async sendNotification(
        recipientId: string,
        payload: NotificationPayload,
        options?: NotificationSendOptions & { parseMode?: 'MarkdownV2' | 'HTML' },
        userId?: string | number
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        try {
            // Use defaultRecipientId if specified in config and recipientId doesn't start with a numeric value
            // This allows override for system messages but uses default for error/admin notifications
            const effectiveRecipientId = !recipientId.match(/^\d/) && this.config.defaultRecipientId 
                ? this.config.defaultRecipientId 
                : recipientId;

            // Add message to queue
            const job = await this.queue.add('send-message', {
                recipientId: effectiveRecipientId,
                payload,
                options,
                userId
            });

            logger.info(`Telegram message enqueued with job ID: ${job.id}`);
            return { 
                success: true, 
                details: { 
                    jobId: job.id,
                    queueName: 'telegram-notifications'
                } 
            };
        } catch (error) {
            logger.error('Error enqueueing Telegram message:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Close the queue and cleanup resources
     */
    public async close(): Promise<void> {
        try {
            await this.queue.close();
            logger.info('Telegram Queue Service closed');
        } catch (error) {
            logger.error('Error closing Telegram Queue Service:', error);
            throw error;
        }
    }
} 