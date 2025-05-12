import { Worker, Job } from 'bullmq';
import logger from 'util/logger';
import appConfig from 'server/configs/app.config';
import emailConfig from 'server/configs/email.config'; // Corrected import for default export
import nodemailer from 'nodemailer';
import { EmailJobData } from '../api/services/email-queue.service'; // Adjusted path

/**
 * Worker responsible for processing email sending jobs from the queue
 */
export class EmailWorker {
    private worker: Worker;
    private transporter: nodemailer.Transporter;
    private isRunning: boolean = false;

    constructor() {
        // Initialize Nodemailer transporter
        this.transporter = nodemailer.createTransport({
            service: emailConfig.service, // Use host/port for more control
            // host: emailConfig.host,
            // port: emailConfig.port,
            // secure: emailConfig.secure, // true for 465, false for other ports
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass,
            },
        });

        // Initialize worker
        const redisConnection = {
            host: appConfig.redisHost || 'localhost',
            port: appConfig.redisPort || 6379,
        };

        this.worker = new Worker<EmailJobData>(
            'email-sending', // Must match the queue name in EmailQueueService
            async (job) => this.processEmailJob(job),
            {
                connection: redisConnection,
                autorun: false, // explicit start required
                concurrency: 5, // Process up to 5 emails concurrently
            }
        );

        this.setupWorkerHandlers();
        logger.info('Email Worker initialized');
    }

    /**
     * Set up worker event handlers
     */
    private setupWorkerHandlers(): void {
        this.worker.on('completed', (job, result) => {
            logger.info(`Job ${job.id} (email to ${job.data.to}) completed.`);
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`Job ${job?.id} (email to ${job?.data.to}) failed with error: ${err.message}`);
            // Potentially add admin notification logic here if needed, similar to TelegramWorker
        });

        this.worker.on('error', (err) => {
            logger.error(`Email Worker error: ${err.message}`);
        });
    }

    /**
     * Process an email sending job
     */
    private async processEmailJob(job: Job<EmailJobData>): Promise<any> {
        const { to, subject, text, html } = job.data;

        try {
            logger.info(`Processing email job ${job.id} for recipient ${to}`);

            const mailOptions = {
                from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
                to,
                subject,
                text,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Failed to send email to ${to} for job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Log the full error for more details during development/debugging
            // console.error(error); 
            throw error; // Re-throw to let BullMQ handle retries/failure
        }
    }

    /**
     * Start the worker
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Email Worker is already running');
            return;
        }

        try {
            // Verify SMTP connection
            await this.transporter.verify();
            logger.info('SMTP connection verified successfully for Email Worker.');

            await this.worker.run(); // Start processing jobs
            this.isRunning = true;
            logger.info('Email Worker started processing jobs');
        } catch (error) {
            logger.error('Error starting Email Worker:', error);
            throw error;
        }
    }

    /**
     * Stop the worker
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('Email Worker is not running.');
            return;
        }
        try {
            await this.worker.close();
            this.isRunning = false;
            logger.info('Email Worker stopped');
        } catch (error) {
            logger.error('Error stopping Email Worker:', error);
            throw error;
        }
    }
}

// If this file is run directly, instantiate and start the worker
if (require.main === module) {
    const emailWorker = new EmailWorker();

    const gracefulShutdown = async () => {
        logger.info('Shutting down Email Worker...');
        await emailWorker.stop();
        process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    emailWorker.start()
        .then(() => logger.info('Email Worker started successfully from direct execution.'))
        .catch(error => {
            logger.error('Failed to start Email Worker from direct execution:', error);
            process.exit(1);
        });
} 