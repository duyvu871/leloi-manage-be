#!/usr/bin/env node

/**
 * Script to start the Telegram worker
 * This runs as a separate process from the main application
 */

import { TelegramWorker } from '../workers/telegram-worker';
import logger from '../shared/utils/logger';

// Create and start the worker
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
    .then(() => {
        logger.info('▶️ Telegram Worker started successfully');
        logger.info('ℹ️ Listening for Telegram notification jobs...');
    })
    .catch(error => {
        logger.error('❌ Failed to start Telegram Worker:', error);
        process.exit(1);
    }); 