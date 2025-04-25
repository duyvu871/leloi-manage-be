import { Queue, QueueEvents } from 'bullmq';
import logger from 'util/logger';
import DocumentProcessService from 'services/document-process.service';
import appConfig from 'server/configs/app.config';

/**
 * ProcessDocumentWorker class
 * 
 * This worker listens for events from document processing queues
 * and handles document processing tasks using DocumentProcessService
 */
export default class ProcessDocumentWorker {
    private documentService: DocumentProcessService;
    private transcriptQueueEvents: QueueEvents;
    private certificateQueueEvents: QueueEvents;
    private isRunning: boolean = false;

    /**
     * Initialize the document processing worker
     */
    constructor() {
        // Initialize document service in consumer mode only
        this.documentService = new DocumentProcessService('consumer');

        // Initialize queue events
        const redisConnection = {
            host: appConfig.redisHost,
            port: appConfig.redisPort
        };

        this.transcriptQueueEvents = new QueueEvents('transcript-processing', {
            connection: redisConnection
        });

        this.certificateQueueEvents = new QueueEvents('certificate-processing', {
            connection: redisConnection
        });

        logger.info('Document processing worker initialized');
    }

    /**
     * Start listening for events
     */
    public start(): void {
        if (this.isRunning) {
            logger.warn('Document processing worker is already running');
            return;
        }

        // Set up event listeners for transcript queue
        this.transcriptQueueEvents.on('completed', ({ jobId, returnvalue }) => {
            logger.info(`Transcript job ${jobId} completed with result: ${JSON.stringify(returnvalue)}`);
            // Additional processing can be added here if needed
        });

        this.transcriptQueueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error(`Transcript job ${jobId} failed with error: ${failedReason}`);
            // Additional error handling can be added here if needed
        });

        // Set up event listeners for certificate queue
        this.certificateQueueEvents.on('completed', ({ jobId, returnvalue }) => {
            logger.info(`Certificate job ${jobId} completed with result: ${JSON.stringify(returnvalue)}`);
            // Additional processing can be added here if needed
        });

        this.certificateQueueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error(`Certificate job ${jobId} failed with error: ${failedReason}`);
            // Additional error handling can be added here if needed
        });

        this.isRunning = true;
        logger.info('Document processing worker started');
    }

    /**
     * Stop listening for events and close connections
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('Document processing worker is not running');
            return;
        }

        try {
            // Close queue event connections
            await this.transcriptQueueEvents.close();
            await this.certificateQueueEvents.close();
            
            // Close document service
            await this.documentService.close();
            
            this.isRunning = false;
            logger.info('Document processing worker stopped');
        } catch (error) {
            logger.error('Error stopping document processing worker:', error);
            throw error;
        }
    }
}


if (require.main === module) {
    const worker = new ProcessDocumentWorker();
    worker.start();
    console.log('Document processing worker started');
    
    // Gracefully handle process termination
    process.on('SIGINT', async () => {
        await worker.stop();
        process.exit(0);
    });
}