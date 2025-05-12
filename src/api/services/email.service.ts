import logger from 'util/logger';
import EmailQueueService from './email-queue.service';
import { EmailJobData } from './email-queue.service';

/**
 * Service responsible for initiating email sending by queueing them.
 * The actual email dispatch is handled by EmailWorker.
 */
class EmailService {
    private emailQueueService: EmailQueueService;

    constructor() {
        this.emailQueueService = new EmailQueueService();
        logger.info('EmailService initialized, using EmailQueueService for email dispatch.');
    }

    /**
     * Enqueues an email to be sent.
     * @param options - EmailJobData containing to, subject, text, and optionally html.
     * @returns Promise<boolean> - True if the email was successfully enqueued, false otherwise.
     */
    async sendEmail(options: EmailJobData): Promise<boolean> {
        try {
            const enqueueResult = await this.emailQueueService.enqueueEmail(options);
            if (enqueueResult.success) {
                logger.info(`Email for ${options.to} successfully enqueued. Job ID: ${enqueueResult.details?.jobId}`);
                return true;
            } else {
                logger.error(`Failed to enqueue email for ${options.to}: ${enqueueResult.error}`);
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during enqueueing';
            logger.error(`Error in sendEmail method for ${options.to}: ${errorMessage}`, { error });
            return false;
        }
    }

    /**
     * Gracefully closes the connection to the email queue service.
     * This might be called during application shutdown.
     */
    async closeQueue(): Promise<void> {
        try {
            await this.emailQueueService.close();
            logger.info('EmailQueueService connection closed by EmailService.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during queue close';
            logger.error('Error closing EmailQueueService from EmailService:', { error: errorMessage });
        }
    }
}

export default EmailService; 