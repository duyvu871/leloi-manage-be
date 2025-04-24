import ProcessDocumentWorker from './process-document';
import logger from 'util/logger';

// Export worker class
export { ProcessDocumentWorker };

// Worker instance
let documentWorker: ProcessDocumentWorker | null = null;

/**
 * Initialize and start document processing worker
 */
export function initDocumentWorker(): void {
    try {
        // Create worker instance if it doesn't exist
        if (!documentWorker) {
            documentWorker = new ProcessDocumentWorker();
            documentWorker.start();
            logger.info('Document worker initialized and started');
        } else {
            logger.warn('Document worker already initialized');
        }
    } catch (error) {
        logger.error('Failed to initialize document worker:', error);
        throw error;
    }
}

/**
 * Stop document processing worker
 */
export async function stopDocumentWorker(): Promise<void> {
    try {
        if (documentWorker) {
            await documentWorker.stop();
            documentWorker = null;
            logger.info('Document worker stopped');
        } else {
            logger.warn('No document worker to stop');
        }
    } catch (error) {
        logger.error('Failed to stop document worker:', error);
        throw error;
    }
}