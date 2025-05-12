import { Queue } from 'bullmq';
import logger from 'util/logger';
import appConfig from 'server/configs/app.config';

// Interface for the data structure of an email job in the queue
export interface EmailJobData {
    to: string;
    subject: string;
    text: string;
    html?: string;
    // Potentially add other relevant fields like userId for tracking, etc.
    // userId?: string | number;
}

/**
 * Service responsible for enqueueing email messages to be processed by a separate worker
 */
export default class EmailQueueService {
    private queue: Queue;
    // private config: EmailConfig; // If you have specific email config for the queue

    constructor(/*config: EmailConfig*/) {
        // this.config = config; // Store config if needed

        // Initialize queue
        const redisConnection = {
            host: appConfig.redisHost || 'localhost',
            port: appConfig.redisPort || 6379
        };

        this.queue = new Queue('email-sending', { // Changed queue name
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 3, // Number of attempts to send the message
                backoff: {
                    type: 'exponential', // Use exponential backoff
                    delay: 10000 // Initial delay of 10 seconds for emails
                },
                removeOnComplete: true, // Remove the job from the queue after it's processed
                removeOnFail: true // Remove the job from the queue if it fails after the maximum number of attempts
            }
        });

        logger.info('Email Queue Service initialized');
    }

    /**
     * Enqueue an email to be sent
     */
    public async enqueueEmail(
        emailData: EmailJobData
    ): Promise<{ success: boolean; details?: any; error?: any }> {
        try {
            const job = await this.queue.add('send-email-job', emailData);

            logger.info(`Email enqueued with job ID: ${job.id} for recipient: ${emailData.to}`);
            return {
                success: true,
                details: {
                    jobId: job.id,
                    queueName: 'email-sending',
                    recipient: emailData.to
                }
            };
        } catch (error) {
            logger.error('Error enqueueing email:', error);
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
            logger.info('Email Queue Service closed');
        } catch (error) {
            logger.error('Error closing Email Queue Service:', error);
            throw error;
        }
    }
} 