import { Worker, Job } from 'bullmq';
import { Telegraf } from 'telegraf';
import logger from 'util/logger';
import appConfig from 'server/configs/app.config';
import { TelegramQueueMessageData } from '../api/services/telegram-queue.service';

/**
 * Worker responsible for processing Telegram messages from the queue
 */
export class TelegramWorker {
    private worker: Worker;
    private bot: Telegraf;
    private isPolling: boolean = false;
    private isRunning: boolean = false;
    private adminChatId: string;

    constructor() {
        if (!appConfig.telegramBotToken) {
            throw new Error('Telegram Bot Token is not configured');
        }

        // Save admin chat ID for error notifications
        // this.adminChatId = appConfig.recipientId || '';

        // Initialize Telegram bot
        this.bot = new Telegraf(appConfig.telegramBotToken);
        this.setupBotHandlers();

        // Initialize worker
        const redisConnection = {
            host: appConfig.redisHost || 'localhost',
            port: appConfig.redisPort || 6379
        };

        this.worker = new Worker(
            'telegram-notifications',
            async (job) => this.processTelegramJob(job),
            { 
                connection: redisConnection,
                autorun: true, // Start processing immediately
                concurrency: 5  // Process up to 5 messages concurrently
            }
        );

        // Setup worker event handlers
        this.setupWorkerHandlers();

        logger.info('Telegram Worker initialized');
    }

    /**
     * Set up Telegram bot event handlers
     */
    private setupBotHandlers(): void {
        this.bot.start((ctx) => {
            logger.info(`Received /start command from chat ID: ${ctx.chat.id}, user: ${ctx.from.username || ctx.from.id}`);
            ctx.reply(`Welcome! Your Chat ID is ${ctx.chat.id}. Please provide this ID to the application if needed.`);
        });

        this.bot.help((ctx) => {
            ctx.reply('This bot is used for system notifications. There are no commands available.');
        });

        // Add other command handlers as needed
    }

    /**
     * Set up worker event handlers
     */
    private setupWorkerHandlers(): void {
        this.worker.on('completed', (job) => {
            logger.info(`Job ${job.id} completed. Message sent to ${job.data.recipientId}`);
        });

        this.worker.on('failed', async (job, err) => {
            logger.error(`Job ${job?.id} failed with error: ${err.message}`);
            
            // If we have an admin chat ID and the job data, send an error notification
            if (this.adminChatId && job) {
                try {
                    const jobData = job.data;
                    
                    // Prepare error message with job details
                    let errorMessage = `❌ *Telegram Notification Failed*\n\n`;
                    errorMessage += `*Job ID:* \`${job.id}\`\n`;
                    errorMessage += `*Error:* \`${err.message}\`\n`;
                    errorMessage += `*Timestamp:* \`${new Date().toISOString()}\`\n\n`;
                    errorMessage += `*Recipient ID:* \`${jobData.recipientId}\`\n`;
                    
                    if (jobData.userId) {
                        errorMessage += `*User ID:* \`${jobData.userId}\`\n`;
                    }
                    
                    // Add original message details
                    errorMessage += `\n*Original Message:*\n`;
                    errorMessage += `*Title:* \`${jobData.payload.title || 'N/A'}\`\n`;
                    errorMessage += `*Type:* \`${jobData.payload.type || 'N/A'}\`\n`;
                    errorMessage += `*Priority:* \`${jobData.payload.priority || 'N/A'}\`\n`;
                    
                    // Include metadata if available
                    if (jobData.payload.metadata) {
                        errorMessage += `\n*Metadata:*\n\`\`\`\n${JSON.stringify(jobData.payload.metadata, null, 2)}\n\`\`\`\n`;
                    }
                    
                    // Include first 200 chars of the original message content
                    if (jobData.payload.message) {
                        const truncatedMessage = jobData.payload.message.substring(0, 200) + 
                            (jobData.payload.message.length > 200 ? '...' : '');
                        errorMessage += `\n*Message Content (truncated):*\n\`\`\`\n${truncatedMessage}\n\`\`\`\n`;
                    }
                    
                    // Send notification to admin
                    await this.bot.telegram.sendMessage(this.adminChatId, errorMessage, {
                        parse_mode: 'MarkdownV2',
                        disable_notification: false
                    });
                    
                    logger.info(`Error notification sent to admin (${this.adminChatId}) for failed job ${job.id}`);
                } catch (notifyError) {
                    logger.error(`Failed to send error notification to admin: ${notifyError instanceof Error ? notifyError.message : 'Unknown error'}`);
                }
            }
        });

        this.worker.on('error', (err) => {
            logger.error(`Worker error: ${err.message}`);
        });
    }

    /**
     * Process a Telegram message job
     */
    private async processTelegramJob(job: Job<TelegramQueueMessageData>): Promise<any> {
        const { recipientId, payload, options } = job.data;

        try {
            logger.info(`Processing Telegram message job ${job.id} for recipient ${recipientId}`);
            
            const messageOptions: any = {};
            if (options?.parseMode) {
                messageOptions.parse_mode = options.parseMode || 'MarkdownV2';
            }

            // Send message through Telegram bot
            const sentMessageInfo = await this.bot.telegram.sendMessage(
                recipientId,
                payload.message,
                messageOptions
            );

            logger.info(`Message sent successfully to chat ID ${recipientId}, message ID: ${sentMessageInfo.message_id}`);
            return sentMessageInfo;
        } catch (error) {
            logger.error(`Failed to send Telegram message to ${recipientId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error; // Re-throw to let BullMQ handle retries
        }
    }

    /**
     * Start the worker and bot
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Telegram Worker is already running');
            return;
        }

        try {
            // Start the bot if not already polling
            if (!this.isPolling) {
                // Delete webhook to ensure polling works correctly
                await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
                
                // Start polling
                await this.bot.launch();
                this.isPolling = true;
                logger.info('Telegram bot started polling');
            }

            // Start the worker
            await this.worker.run();
            this.isRunning = true;
            
            logger.info('Telegram Worker started processing jobs');
        } catch (error) {
            logger.error('Error starting Telegram Worker:', error);
            throw error;
        }
    }

    /**
     * Stop the worker and bot
     */
    public async stop(): Promise<void> {
        try {
            // Stop the worker
            await this.worker.close();
            
            // Stop the bot if it's polling
            if (this.isPolling) {
                await this.bot.stop();
                this.isPolling = false;
            }

            this.isRunning = false;
            logger.info('Telegram Worker stopped');
        } catch (error) {
            logger.error('Error stopping Telegram Worker:', error);
            throw error;
        }
    }
}

// If this file is run directly, start the worker
if (require.main === module) {
    const worker = new TelegramWorker();
    
    // Handle process termination gracefully
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT signal');
        await worker.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM signal');
        await worker.stop();
        process.exit(0);
    });

    // Start the worker
    worker.start()
        .then(() => logger.info('Telegram Worker started successfully'))
        .catch(error => {
            logger.error('Failed to start Telegram Worker:', error);
            process.exit(1);
        });
} 