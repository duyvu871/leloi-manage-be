import axios from 'axios';
import { Readable } from 'stream';
import { Queue, Worker, QueueEvents } from 'bullmq';
import logger from 'util/logger';
import BadRequest from 'responses/client-errors/bad-request';
import InternalServerError from 'responses/server-errors/internal-server-error';
import appConfig from 'server/configs/app.config';
import prisma from 'repository/prisma';
import fs from 'fs/promises';
import AssetFsService from './asset-fs.service';
import e from 'express';

// Define interfaces for document processing
export interface TranscriptProcessResult {
    [grade: string]: {
        Tên: string;
        Điểm: Array<{
            Môn: string;
            Mức: string;
            Điểm: number | string;
        }>;
        'Phẩm chất'?: {
            [quality: string]: string;
        };
        'Năng lực'?: {
            [ability: string]: string;
        };
    };
}

export interface CertificateProcessResult {
    name: string;
    extracted_name: string;
    level: string;
    correct: boolean;
}

export interface DocumentProcessJob {
    id: string;
    userId: number;
    fileId: number;
    fileName: string;
    fileUrl: string;
    path: string;
    applicationId: number;
    type: 'transcript' | 'certificate';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: TranscriptProcessResult | CertificateProcessResult;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Service class for processing documents (transcripts and certificates)
 * Uses BullMQ for job queue management
 */
export default class DocumentProcessService {
    private transcriptQueue: Queue;
    private certificateQueue: Queue;
    private transcriptWorker: Worker;
    private certificateWorker: Worker;
    private apiBaseUrl: string = 'https://api.connectedbrain.com.vn/api/v1/leloi'; // Default API URL
    private role: 'producer' | 'consumer' | 'both';
    private documentJobs: Map<string, DocumentProcessJob> = new Map();
    private assetFs: AssetFsService;
    /**
     * Initializes the DocumentProcessService with Redis connection and queues
     * @param role - The role of this service instance ('producer', 'consumer', or 'both')
     */
    constructor(role: 'producer' | 'consumer' | 'both' = 'both') {
        this.role = role;
        // Initialize queues and workers
        try {
            this.assetFs = new AssetFsService();

            // Set up Redis connection

            const redisConnection = {
                host: appConfig.redisHost,
                port: appConfig.redisPort
            };

            // Create queues if role is producer or both
            if (this.role === 'producer' || this.role === 'both') {
                this.transcriptQueue = new Queue('transcript-processing', {
                    connection: redisConnection
                });

                this.certificateQueue = new Queue('certificate-processing', {
                    connection: redisConnection
                });
            }

            // Create workers if role is consumer or both
            if (this.role === 'consumer' || this.role === 'both') {
                this.transcriptWorker = new Worker('transcript-processing',
                    async (job) => this.processTranscriptJob(job.data),
                    { connection: redisConnection }
                );

                this.certificateWorker = new Worker('certificate-processing',
                    async (job) => this.processCertificateJob(job.data),
                    { connection: redisConnection }
                );
            }

            // Set up event handlers if role is consumer or both
            if (this.role === 'consumer' || this.role === 'both') {
                this.transcriptWorker.on('completed', (job, result) => {
                    logger.info(`Transcript job ${job.id} completed with result: ${JSON.stringify(result)}`);
                });

                this.transcriptWorker.on('failed', (job, error) => {
                    logger.error(`Transcript job ${job?.id || 'unknown'} failed with error: ${error.message}`);
                });

                this.certificateWorker.on('completed', (job, result) => {
                    logger.info(`Certificate job ${job.id} completed with result: ${JSON.stringify(result)}`);
                });

                this.certificateWorker.on('failed', (job, error) => {
                    logger.error(`Certificate job ${job?.id || 'unknown'} failed with error: ${error.message}`);
                });
            }

            logger.info('Document processing service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize document processing service:', error);
            throw error;
        }
    }

    /**
     * Processes a transcript document (PDF)
     * @param file - The file to process (must be a Multer file object)
     * @param userId - The ID of the user uploading the file
     * @returns Promise containing job ID and initial status
     * @throws {BadRequest} When file is missing or invalid
     */
    public async processTranscript(applicationId: number, docId: number, userId: number): Promise<{ id: string, jobId?: string, status: string }> {
        // Check if service is configured as producer or both
        if (this.role !== 'producer' && this.role !== 'both') {
            throw new InternalServerError(
                'INVALID_SERVICE_ROLE',
                'Service not configured as producer',
                'This service instance is not configured to produce jobs'
            );
        }

        if (!applicationId) {
            throw new BadRequest('APPLICATION_NOT_FOUND', 'Application not found', 'Không tìm thấy thông tin hồ sơ');
        }

        try {
            const document = await prisma.document.findUnique({
                where: { id: docId }
            });

            if (!document) {
                throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', 'Không tìm thấy tài liệu');
            }

            const jobId = `transcirpt-${Date.now()}-${docId}`;
            const jobData: DocumentProcessJob = {
                id: jobId,
                userId,
                fileId: document.id,
                fileName: document.name,
                fileUrl: document.url,
                path: document.filePath,
                applicationId: applicationId,
                type: 'transcript',
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            this.documentJobs.set(jobId, jobData);
            
            const job = await this.transcriptQueue.add(`process-transcript`, jobData, {
                jobId: jobData.id,
                removeOnComplete: true
            });

            logger.info(`Added transcript processing job to queue: ${job.id}`);

            return {
                id: jobData.id,
                jobId: job.id,
                status: 'pending'
            };
        } catch (error) {
            logger.error('Error adding transcript job to queue:', error);
            throw error;
        }
    }

    /**
     * Processes a certificate document (image)
     * @param file - The file to process (must be a Multer file object)
     * @param userId - The ID of the user uploading the file
     * @param name - Optional name parameter for certificate verification
     * @returns Promise containing job ID and initial status
     * @throws {BadRequest} When file is missing or invalid
     */
    public async processCertificate(applicationId: number, docId: number, userId: number): Promise<{ id: string, jobId?: string, status: string }> {
        // Check if service is configured as producer or both
        if (this.role !== 'producer' && this.role !== 'both') {
            throw new InternalServerError(
                'INVALID_SERVICE_ROLE',
                'Service not configured as producer',
                'This service instance is not configured to produce jobs'
            );
        }

        if (!applicationId) {
            throw new BadRequest('APPLICATION_NOT_FOUND', 'Application not found', 'Không tìm thấy thông tin hồ sơ');
        }

        try {
                const document = await prisma.document.findUnique({
                    where: { id: docId }
                });

                if (!document) {
                    throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', 'Không tìm thấy tài liệu');
                }

                const jobId = `certificate-${Date.now()}-${docId}`;
                const jobData: DocumentProcessJob = {
                    id: jobId,
                    userId,
                    fileId: document.id,
                    fileName: document.name,
                    fileUrl: document.url,
                    path: document.filePath,
                    applicationId: applicationId,
                    type: 'certificate',
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }

                this.documentJobs.set(jobId, jobData);
                
                const job = await this.certificateQueue.add(`process-certificate`, jobData, {
                    jobId: jobData.id,
                    removeOnComplete: true
                });

                logger.info(`Added certificate processing job to queue: ${job.id}`);

                return {
                    id: jobData.id,
                    jobId: job.id,
                    status: 'pending'
                };

        } catch (error) {
            logger.error('Error adding certificate job to queue:', error);
            throw new InternalServerError(
                'PROCESSING_FAILED',
                'Failed to process certificate',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Gets the status of a document processing job
     * @param jobId - The ID of the job to check
     * @returns Promise containing job status and result if available
     * @throws {BadRequest} When job is not found
     */
    public async getJobStatus(jobId: string): Promise<{ status: string, result?: any }> {
        // Check if service is configured as producer or both
        if (this.role !== 'producer' && this.role !== 'both') {
            throw new InternalServerError(
                'INVALID_SERVICE_ROLE',
                'Service not configured as producer',
                'This service instance is not configured to access job queues'
            );
        }

        try {
            let job;

            if (jobId.startsWith('transcript-')) {
                job = await this.transcriptQueue.getJob(jobId);
            } else if (jobId.startsWith('certificate-')) {
                job = await this.certificateQueue.getJob(jobId);
            } else {
                throw new BadRequest('INVALID_JOB_ID', 'Invalid job ID', 'Job ID format is invalid');
            }

            if (!job) {
                throw new BadRequest('JOB_NOT_FOUND', 'Job not found', `Job with ID ${jobId} not found`);
            }

            return {
                status: job.data.status,
                result: job.data.result
            };
        } catch (error) {
            logger.error('Error getting job status:', error);
            throw error instanceof BadRequest ? error : new InternalServerError(
                'STATUS_CHECK_FAILED',
                'Failed to check job status',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Private method to process transcript job
     * @param jobData - The job data containing file information
     * @returns Promise containing processing result
     * @private
     */
    private async processTranscriptJob(jobData: DocumentProcessJob): Promise<TranscriptProcessResult> {
        try {
            // Update job status
            await this.updateJobStatus(jobData.id, 'processing');

            // Get document from database
            const document = await prisma.document.findUnique({
                where: { id: jobData.fileId }
            });

            if (!document) {
                throw new Error(`Document not found with ID: ${jobData.fileId}`);
            }

            // Create form data for API request
            const formData = new FormData();
            const file = await fs.readFile(document.filePath);

            const blob = new Blob([file], { type: document.mimeType });
            formData.append('file', blob, document.name);

            // Call external API
            logger.info(`Sending request to ${this.apiBaseUrl}/upload-pdf/ for document ${document.name}`);
            const response = await axios.post(`${this.apiBaseUrl}/upload-pdf/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            // Update job with result
            await this.updateJobStatus(jobData.id, 'completed', response.data);

            // Update ExtractedData
            await prisma.extractedData.create({
                data: {
                    documentId: jobData.fileId,
                    data: response.data,
                    isVerified: false
                }
            });

            return response.data;
        } catch (error) {
            // Update job with error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.updateJobStatus(jobData.id, 'failed', undefined, errorMessage);

            // Safely log error without circular references
            logger.error(`Error processing transcript job ${jobData.id}: ${errorMessage}`);
            if (error instanceof Error && error.stack) {
                logger.error(error.stack);
            }
            
            throw error;
        }
    }

    /**
     * Private method to process certificate job
     * @param jobData - The job data containing file information
     * @returns Promise containing processing result
     * @private
     */
    private async processCertificateJob(jobData: DocumentProcessJob): Promise<CertificateProcessResult> {
        try {
            // Update job status
            await this.updateJobStatus(jobData.id, 'processing');

            // Get document from database
            const document = await prisma.document.findUnique({
                where: { id: jobData.fileId }
            });

            if (!document) {
                throw new Error(`Document not found with ID: ${jobData.fileId}`);
            }

            // Create form data for API request
            const formData = new FormData();
            const file = await fs.readFile(document.filePath);

            const blob = new Blob([file], { type: document.mimeType });
            formData.append('file', blob, document.name);

            // Build URL with name parameter if provided
            let url = `${this.apiBaseUrl}/certificate`;

            // Call external API
            logger.info(`Sending request to ${url} for document ${document.name}`);
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            // Update job with result
            await this.updateJobStatus(jobData.id, 'completed', response.data);

            // Update ExtractedData
            await prisma.extractedData.create({
                data: {
                    documentId: jobData.fileId,
                    data: response.data,
                    isVerified: false
                }
            });

            return response.data;
        } catch (error) {
            // Update job with error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.updateJobStatus(jobData.id, 'failed', undefined, errorMessage);

            // Safely log error without circular references
            logger.error(`Error processing certificate job ${jobData.id}: ${errorMessage}`);
            if (error instanceof Error && error.stack) {
                logger.error(error.stack);
            }
            
            throw error;
        }
    }

    /**
     * Private method to update job status
     * @param jobId - The ID of the job to update
     * @param status - The new status
     * @param result - Optional result data
     * @param error - Optional error message
     * @private
     */
    private async updateJobStatus(jobId: string, status: DocumentProcessJob['status'], result?: any, error?: string): Promise<void> {
        try {
            // In consumer mode, we don't have access to the queues, so we need to handle this differently
            if (this.role === 'consumer') {
                // Just log the status update since we can't access the queue
                logger.info(`Job ${jobId} status updated to ${status} (consumer mode)`);
                return;
            }

            let queue: Queue;
            if (jobId.startsWith('transcript-')) {
                queue = this.transcriptQueue;
            } else if (jobId.startsWith('certificate-')) {
                queue = this.certificateQueue;
            } else {
                throw new Error('Invalid job ID');
            }

            const job = await queue?.getJob(jobId);
            if (!job) {
                throw new Error(`Job with ID ${jobId} not found`);
            }

            const updatedData = {
                ...job.data,
                status,
                updatedAt: new Date()
            };

            if (result) {
                updatedData.result = result;
            }

            if (error) {
                updatedData.error = error;
            }

            // Use the appropriate BullMQ method to update job data
            await job.updateData(updatedData);
        } catch (error) {
            logger.error(`Error updating job status for ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Upload and process a document
     * @param file - The file to process (must be a Multer file object)
     * @param type - The type of document ('transcript', 'certificate', etc.)
     * @param applicationId - The ID of the application this document belongs to
     * @param userId - The ID of the user uploading the file
     * @param metadata - Optional metadata for the document
     * @returns Promise containing job ID and initial status
     * @throws {BadRequest} When file is missing or invalid
     */
    public async uploadAndProcessDocument(
        file: Express.Multer.File,
        type: 'transcript' | 'certificate',
        applicationId: number,
        userId: number,
        metadata?: Record<string, unknown>
    ): Promise<{ id: string, jobId?: string, status: string }> {
        if (!file) {
            throw new BadRequest('FILE_REQUIRED', 'File is required', 'No file was provided for processing');
        }

        if (!file.buffer || !file.originalname || !file.mimetype) {
            throw new BadRequest('INVALID_FILE', 'Invalid file format', 'The provided file is missing required properties');
        }

        // Store the file in the file system
        const fileSaved = await this.assetFs.uploadFile(file, userId, {
            applicationId,
            type,
            ...metadata
        });

        if (!fileSaved) {
            throw new BadRequest('FILE_UPLOAD_FAILED', 'Failed to upload file', 'Có lỗi xảy ra khi tải lên file');
        }

        // create document in the database
        const document = await prisma.document.create({
            data: {
                name: fileSaved.fileName,
                type,
                mimeType: fileSaved.mimetype,
                url: fileSaved.url,
                filePath: fileSaved.filePath,
                fileSize: fileSaved.fileSize,
                uploadedAt: new Date(),
            }
        });

        await prisma.applicationDocument.create({
            data: {
                applicationId,
                status: 'pending',
                type,
                documentId: document.id
            }
        });

        if (!fileSaved) {
            throw new InternalServerError(
                'FILE_UPLOAD_FAILED',
                'Failed to upload file',
                'Có lỗi xảy ra khi tải lên file'
            );
        }

        // Determine which processing method to use based on document type
        let result: { id: string, jobId?: string, status: string };
        if (type === 'transcript') {
            if (file.mimetype !== 'application/pdf') {
                throw new BadRequest('INVALID_FILE_TYPE', 'Invalid file type', 'Only PDF files are accepted for transcript processing');
            }
            return await this.processTranscript(applicationId, document.id, userId);
        } else if (type === 'certificate') {
            if (!file.mimetype.startsWith('image/')) {
                throw new BadRequest('INVALID_FILE_TYPE', 'Invalid file type', 'Only image files are accepted for certificate processing');
            }
            return await this.processCertificate(applicationId, document.id, userId);
        }
        return { id: '', jobId: '', status: '' };
    }

    /**
     * Get all documents for a specific application
     * @param applicationId - The ID of the application
     * @param userId - The ID of the user requesting the documents
     * @returns Promise containing array of documents
     */
    public async getApplicationDocuments(applicationId: string, userId: string | number): Promise<DocumentProcessJob[]> {
        // In a real implementation, this would query a database
        // For now, we'll filter the in-memory map
        const documents: DocumentProcessJob[] = [];

        // Check in-memory jobs
        // for (const job of this.documentJobs.values()) {
        //     if (job.applicationId === applicationId && job.userId === userId) {
        //         documents.push(job);
        //     }
        // }

        // In a real implementation, you would also check the database
        // and possibly merge results from the queue

        return documents;
    }

    /**
     * Get extracted data for a specific document
     * @param documentId - The ID of the document
     * @param userId - The ID of the user requesting the data
     * @returns Promise containing the extracted data
     * @throws {BadRequest} When document is not found
     */
    public async getExtractedData(documentId: string, userId: string | number): Promise<Record<string, unknown>> {
        // Get the job from memory or queue
        const job = this.documentJobs.get(documentId) || await this.getJobById(documentId);

        if (!job) {
            throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', `Document with ID ${documentId} not found`);
        }

        // Check if user has permission to access this document
        if (job.userId !== userId) {
            throw new BadRequest('PERMISSION_DENIED', 'Permission denied', 'You do not have permission to access this document');
        }

        // Check if processing is complete
        if (job.status !== 'completed') {
            throw new BadRequest('PROCESSING_INCOMPLETE', 'Processing incomplete', `Document processing is ${job.status}`);
        }

        // Return the extracted data
        // @ts-ignore
        return job.result || {};
    }

    /**
     * Verify extracted data
     * @param extractedDataId - The ID of the extracted data (same as document ID)
     * @param isVerified - Whether the data is verified as correct
     * @param userId - The ID of the user verifying the data
     * @returns Promise containing the updated job
     * @throws {BadRequest} When document is not found
     */
    public async verifyExtractedData(extractedDataId: string, isVerified: boolean, userId: string | number): Promise<DocumentProcessJob> {
        // Get the job from memory or queue
        const job = this.documentJobs.get(extractedDataId) || await this.getJobById(extractedDataId);

        if (!job) {
            throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', `Document with ID ${extractedDataId} not found`);
        }

        // Check if user has permission to verify this document
        if (job.userId !== userId) {
            throw new BadRequest('PERMISSION_DENIED', 'Permission denied', 'You do not have permission to verify this document');
        }

        // Update verification status
        // job.isVerified = isVerified;
        job.updatedAt = new Date();

        // Save updated job (in a real implementation, this would update the database)
        this.documentJobs.set(extractedDataId, job);

        return job;
    }

    /**
     * Helper method to get a job by ID from the queue
     * @param jobId - The ID of the job
     * @returns Promise containing the job or null if not found
     * @private
     */
    private async getJobById(jobId: string): Promise<DocumentProcessJob | null> {
        try {
            // In consumer mode, we don't have access to the queues, so we need to handle this differently
            if (this.role === 'consumer') {
                logger.info(`Cannot access job ${jobId} in consumer mode`);
                return null;
            }

            let job;

            if (jobId.startsWith('transcript-')) {
                job = await this.transcriptQueue?.getJob(jobId);
            } else if (jobId.startsWith('certificate-')) {
                job = await this.certificateQueue?.getJob(jobId);
            } else if (jobId.startsWith('document-')) {
                // For other document types, we only have in-memory storage in this implementation
                return null;
            } else {
                return null;
            }

            return job ? job.data : null;
        } catch (error) {
            logger.error(`Error getting job ${jobId}:`, error);
            return null;
        }
    }

    /**
     * Closes queues and workers when service is shutting down
     */
    public async close(): Promise<void> {
        try {
            // Close workers if they exist (consumer or both role)
            if (this.role === 'consumer' || this.role === 'both') {
                if (this.transcriptWorker) await this.transcriptWorker.close();
                if (this.certificateWorker) await this.certificateWorker.close();
            }

            // Close queues if they exist (producer or both role)
            if (this.role === 'producer' || this.role === 'both') {
                if (this.transcriptQueue) await this.transcriptQueue.close();
                if (this.certificateQueue) await this.certificateQueue.close();
            }

            logger.info('Document processing service closed successfully');
        } catch (error) {
            logger.error('Error closing document processing service:', error);
            throw error;
        }
    }
}