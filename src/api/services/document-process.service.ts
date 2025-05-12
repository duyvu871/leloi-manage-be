import axios from 'axios';
import { Readable } from 'stream';
import { Queue, Worker, QueueEvents } from 'bullmq';
import logger from 'util/logger';
import BadRequest from 'responses/client-errors/bad-request';
import InternalServerError from 'responses/server-errors/internal-server-error';
import appConfig from 'server/configs/app.config';
import prisma from 'repository/prisma';
import fs from 'fs/promises';
import AssetFsService from 'services/asset-fs.service';
import path from 'path';
import { TranscriptProcessResultDto } from 'server/common/dto/document-process.dto';
import DocumentJobService from 'services/document-job.service';
import { CertificateProcessResult, DocumentProcessJob, TranscriptData } from 'server/common/interfaces/document-process.interface';
import { DocumentProcessStatus, ApplicationFailedReason, ApplicationFailedReasonMessage } from 'server/common/enums/services/document-process.enum';
import { VietnameseAccentConverter } from 'server/shared/utils/non-acent-vietnam';
import { ProcessServiceValidation } from '../validations/process.service.validation';
import { PrismaPaginationOptions } from 'server/shared/helpers/pagination-parse';
import { Transaction } from 'server/@types/prisma';

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
    private documentJobService: DocumentJobService;
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
            this.documentJobService = new DocumentJobService();

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
                    async (job) => this.processTranscriptJob(job.data as DocumentProcessJob<any>),
                    { connection: redisConnection }
                );

                this.certificateWorker = new Worker('certificate-processing',
                    async (job) => this.processCertificateJob(job.data as DocumentProcessJob<any>),
                    { connection: redisConnection }
                );
            }

            // Set up event handlers if role is consumer or both
            if (this.role === 'consumer' || this.role === 'both') {
                this.transcriptWorker.on('completed', (job, result) => {
                    logger.info(`Transcript job ${job.id} completed. Return value type: ${typeof result}`);
                });

                this.transcriptWorker.on('failed', (job, error) => {
                    logger.error(`Transcript job ${job?.id || 'unknown'} failed with error: ${error.message}`);
                });

                this.certificateWorker.on('completed', (job, result) => {
                    logger.info(`Certificate job ${job.id} completed. Return value type: ${typeof result}`);
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
     * @param applicationDocumentId - The ID of the ApplicationDocument record
     * @param docId - The ID of the document
     * @param userId - The ID of the user uploading the file
     * @returns Promise containing job ID and initial status
     * @throws {BadRequest} When file is missing or invalid
     */
    public async processTranscript(applicationDocumentId: number, docId: number, userId: number, tx?: Transaction): Promise<{ id: string, jobId?: string, status: string }> {
        const prismaTx = tx || prisma;
        // Check if service is configured as producer or both
        if (this.role !== 'producer' && this.role !== 'both') {
            throw new InternalServerError(
                'INVALID_SERVICE_ROLE',
                'Service not configured as producer',
                'This service instance is not configured to produce jobs'
            );
        }

        if (!applicationDocumentId) {
            throw new BadRequest('APPLICATION_NOT_FOUND', 'Application not found', 'Không tìm thấy thông tin hồ sơ');
        }

        try {
            const document = await prismaTx.document.findUnique({
                where: { id: docId }
            });

            if (!document) {
                throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', 'Không tìm thấy tài liệu');
            }

            const jobId = `transcript-${Date.now()}-${docId}`;
            const jobData: DocumentProcessJob<any> = {
                id: jobId,
                userId,
                fileId: document.id,
                fileName: document.name,
                fileUrl: document.url,
                path: document.filePath,
                applicationDocumentId: applicationDocumentId,
                type: 'transcript',
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            await this.documentJobService.createJob(jobData);
            
            // If there's an existing job for this document, let's delete it
            // const existingJobs = await this.transcriptQueue.getJobs(['active', 'waiting', 'delayed']);
            // for (const job of existingJobs) {
            //     if (job.data.fileId === document.id) {
            //         logger.info(`Removing existing job ${job.id} for document ${document.id}`);
            //         await job.remove();
            //     }
            // }

            const job = await this.transcriptQueue.add(`process-transcript`, jobData, {
                jobId: jobData.id,
                removeOnComplete: true,
                removeOnFail: true,
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
     * @param applicationDocumentId - The ID of the ApplicationDocument record
     * @param docId - The ID of the document
     * @param userId - The ID of the user uploading the file
     * @returns Promise containing job ID and initial status
     * @throws {BadRequest} When file is missing or invalid
     */
    public async processCertificate(applicationDocumentId: number, docId: number, userId: number, tx?: Transaction): Promise<{ id: string, jobId?: string, status: string }> {
        const prismaTx = tx || prisma;
        // Check if service is configured as producer or both
        if (this.role !== 'producer' && this.role !== 'both') {
            throw new InternalServerError(
                'INVALID_SERVICE_ROLE',
                'Service not configured as producer',
                'This service instance is not configured to produce jobs'
            );
        }

        if (!applicationDocumentId) {
            throw new BadRequest('APPLICATION_DOCUMENT_NOT_FOUND', 'Application document not found', 'Không tìm thấy thông tin hồ sơ');
        }

        try {
            const document = await prismaTx.document.findUnique({
                where: { id: docId }
            });

            if (!document) {
                throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', 'Không tìm thấy tài liệu');
            }

            const jobId = `certificate-${Date.now()}-${docId}`;
            const jobData: DocumentProcessJob<any> = {
                id: jobId,
                userId,
                fileId: document.id,
                fileName: document.name,
                fileUrl: document.url,
                path: document.filePath,
                applicationDocumentId: applicationDocumentId,
                type: 'certificate',
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            this.documentJobService.createJob(jobData);
            
            // If there's an existing job for this document, let's delete it
            // const existingJobs = await this.certificateQueue.getJobs(['active', 'waiting', 'delayed']);
            // for (const job of existingJobs) {
            //     if (job.data.fileId === document.id) {
            //         logger.info(`Removing existing job ${job.id} for document ${document.id}`);
            //         await job.remove();
            //     }
            // }

            const job = await this.certificateQueue.add(`process-certificate`, jobData, {
                jobId: jobData.id,
                removeOnComplete: true,
                removeOnFail: true,
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

            let parsedResult = job.data.result;
            if (typeof job.data.result === 'string') {
                try {
                    parsedResult = JSON.parse(job.data.result);
                } catch (e) {
                    logger.warn(`Failed to parse job.data.result for job ${jobId} as JSON. Returning raw string.`);
                }
            }

            return {
                status: job.data.status,
                result: parsedResult
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
    private async processTranscriptJob(jobData: DocumentProcessJob<any>): Promise<Record<string, TranscriptData>> {
        try {

            console.log('jobData', jobData.id);

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
            const filePath = path.join(process.cwd(), document.filePath)
            const file = await fs.readFile(filePath);

            const blob = new Blob([file], { type: document.mimeType });
            formData.append('file', blob, document.name);

            // Call external API
            logger.info(`Sending request to ${this.apiBaseUrl}/upload-pdf/ for document ${document.name}`);
            const response = await axios.post<TranscriptProcessResultDto>(`${this.apiBaseUrl}/upload-pdf/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            // console.log('response', JSON.stringify(response.data));


            const parsedData = this.parseExtractData(response.data);

            // console.log('parsedData', parsedData);

            // Update job with result
            await this.updateJobStatus(jobData.id, 'completed', parsedData);
            // Update ExtractedData
            await prisma.extractedData.create({
                data: {
                    documentId: jobData.fileId,
                    data: JSON.stringify(parsedData),
                    isVerified: false
                }
            });

            await prisma.applicationDocument.update({
                where: { id: jobData.applicationDocumentId },
                data: {
                    status: 'completed'
                }
            });

            return parsedData;
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
    private async processCertificateJob(jobData: DocumentProcessJob<any>): Promise<CertificateProcessResult> {
        try {
            // Update job status
            await this.updateJobStatus(jobData.id, 'processing');

            // Get document from database
            const document = await prisma.document.findUnique({
                where: { id: jobData.fileId }
            });

            if (!document) {
                console.error(`Document not found with ID: ${jobData.fileId}`);
                throw new Error(DocumentProcessStatus.DOCUMENT_NOT_FOUND);
            }

            const userData = await prisma.user.findUnique({
                where: { id: jobData.userId },
                select: {
                    students: {
                        select: {
                            registration: {
                                select: {
                                    fullName: true
                                }
                            }
                        }
                    }
                }
            });

            if (!userData || !userData.students || userData.students.length === 0) {
                console.error(`User not found with ID: ${jobData.userId}`);
                throw new Error(DocumentProcessStatus.USER_NOT_FOUND);
            }

            const fullName = userData.students?.[0]?.registration?.fullName;

            // Create form data for API request
            const formData = new FormData();
            const filePath = path.join(process.cwd(), document.filePath)
            const file = await fs.readFile(filePath);

            const blob = new Blob([file], { type: document.mimeType });
            formData.append('file', blob, document.name);

            // Build URL with name parameter if provided
            let url = `${this.apiBaseUrl}/certificate?name=${encodeURIComponent(fullName || '')}`;

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

            await prisma.applicationDocument.update({
                where: { id: jobData.applicationDocumentId },
                data: {
                    status: 'completed'
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
    private async updateJobStatus(jobId: string, status: DocumentProcessJob<any>['status'], result?: any, error?: string): Promise<void> {
        try {
            console.log(`Updating job status for ${jobId} to ${status}`);

            // Update job status in Redis
            await this.documentJobService.updateJobStatus(jobId, status, result, error);

            // Update queue job data if in producer mode
            if (this.role !== 'consumer') {
                let queue: Queue;
                if (jobId.startsWith('transcript-')) {
                    queue = this.transcriptQueue;
                } else if (jobId.startsWith('certificate-')) {
                    queue = this.certificateQueue;
                } else {
                    throw new Error('Invalid job ID');
                }

                const job = await queue?.getJob(jobId);
                if (job) {
                    let stringResult = job.data.result;
                    if (typeof result !== 'undefined') {
                        stringResult = (typeof result === 'object' && result !== null) ? JSON.stringify(result) : String(result);
                    }

                    const updatedData = {
                        ...job.data,
                        status,
                        updatedAt: new Date(),
                        result: stringResult,
                        error: error || job.data.error
                    };
                    await job.updateData(updatedData);
                }
            }

            logger.info(`Job ${jobId} status updated to ${status}`);
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

        // Use a transaction to ensure data consistency while checking and creating/updating
        return await prisma.$transaction(async (tx) => {
            let document;
            let applicationDocument;

            // For transcript type, we update any existing document
            // For certificate type, we always create a new document
            if (type === 'transcript') {
                // Check if a transcript document already exists for this application
                const existingApplicationDocument = await tx.applicationDocument.findFirst({
                    where: {
                        applicationId,
                        type: 'transcript',
                    },
                    include: {
                        document: true
                    }
                });

                logger.info(`Checking for existing transcript for application ${applicationId}: ${existingApplicationDocument ? 'Found' : 'Not found'}`);
                
                // Store the file in the file system
                const fileSaved = await this.assetFs.uploadFile(file, userId, {
                    applicationId,
                    type,
                    ...metadata
                });

                if (!fileSaved) {
                    logger.error(`File upload failed for user ${userId}, application ${applicationId}, type ${type}`);
                    throw new BadRequest('FILE_UPLOAD_FAILED', 'Failed to upload file', 'Có lỗi xảy ra khi tải lên file');
                }

                logger.info(`Transcript file saved: ${fileSaved.fileName}, Size: ${fileSaved.fileSize}`);

                if (existingApplicationDocument) {
                    // Update existing transcript
                    logger.info(`Updating existing transcript for application ${applicationId}, doc ID: ${existingApplicationDocument.documentId}`);
                    
                    // Update the document
                    document = await tx.document.update({
                        where: { id: existingApplicationDocument.documentId },
                        data: {
                            name: fileSaved.fileName,
                            mimeType: fileSaved.mimetype,
                            url: fileSaved.url,
                            filePath: fileSaved.storagePath,
                            fileSize: fileSaved.fileSize,
                            uploadedAt: new Date(),
                        }
                    });
                    
                    logger.info(`Updated transcript document with ID ${document.id}`);
                    
                    // Update the application document status
                    applicationDocument = await tx.applicationDocument.update({
                        where: { id: existingApplicationDocument.id },
                        data: {
                            status: 'pending',
                        }
                    });
                    
                    logger.info(`Updated application document with ID ${applicationDocument.id} to status 'pending'`);
                    
                    // Delete any existing extracted data
                    const deletedData = await tx.extractedData.deleteMany({
                        where: {
                            documentId: document.id
                        }
                    });
                    
                    logger.info(`Deleted ${deletedData.count} extracted data records for transcript ${document.id}`);
                } else {
                    // Create new transcript document
                    logger.info(`Creating new transcript document for application ${applicationId}`);
                    
                    // Create document in the database
                    document = await tx.document.create({
                        data: {
                            name: fileSaved.fileName,
                            type,
                            mimeType: fileSaved.mimetype,
                            url: fileSaved.url,
                            filePath: fileSaved.storagePath,
                            fileSize: fileSaved.fileSize,
                            uploadedAt: new Date(),
                        }
                    });
                    
                    logger.info(`Created new transcript document with ID ${document.id}`);
                    
                    // Create application document relationship
                    applicationDocument = await tx.applicationDocument.create({
                        data: {
                            applicationId,
                            status: 'pending',
                            type,
                            documentId: document.id
                        }
                    });
                    
                    logger.info(`Created new transcript application document with ID ${applicationDocument.id}`);
                }

                // Check file type and process
                if (file.mimetype !== 'application/pdf') {
                    throw new BadRequest('INVALID_FILE_TYPE', 'Invalid file type', 'Only PDF files are accepted for transcript processing');
                }
                return await this.processTranscript(applicationDocument.id, document.id, userId);
                
            } else if (type === 'certificate') {
                // For certificates, we always create a new document (multiple certificates allowed)
                logger.info(`Creating new certificate document for application ${applicationId}`);
                
                // Store the file in the file system
                const fileSaved = await this.assetFs.uploadFile(file, userId, {
                    applicationId,
                    type,
                    ...metadata
                });

                if (!fileSaved) {
                    logger.error(`File upload failed for user ${userId}, application ${applicationId}, type ${type}`);
                    throw new BadRequest('FILE_UPLOAD_FAILED', 'Failed to upload file', 'Có lỗi xảy ra khi tải lên file');
                }

                logger.info(`Certificate file saved: ${fileSaved.fileName}, Size: ${fileSaved.fileSize}`);
                
                // Create document in the database
                document = await tx.document.create({
                    data: {
                        name: fileSaved.fileName,
                        type,
                        mimeType: fileSaved.mimetype,
                        url: fileSaved.url,
                        filePath: fileSaved.storagePath,
                        fileSize: fileSaved.fileSize,
                        uploadedAt: new Date(),
                    }
                });
                
                logger.info(`Created new certificate document with ID ${document.id}`);
                
                // Create application document relationship
                applicationDocument = await tx.applicationDocument.create({
                    data: {
                        applicationId,
                        status: 'pending',
                        type,
                        documentId: document.id
                    }
                });
                
                logger.info(`Created new certificate application document with ID ${applicationDocument.id}`);

                // Check file type and process
                if (!file.mimetype.startsWith('image/')) {
                    throw new BadRequest('INVALID_FILE_TYPE', 'Invalid file type', 'Only image files are accepted for certificate processing');
                }
                return await this.processCertificate(applicationDocument.id, document.id, userId, tx);
            }
            
            return { id: '', jobId: '', status: '' };
        });
    }

    /**
     * Get all documents for a specific application
     * @param applicationId - The ID of the application
     * @param userId - The ID of the user requesting the documents
     * @returns Promise containing array of documents
     */
    public async getApplicationDocuments(applicationId: string, userId: number | string, filter?: PrismaPaginationOptions<'applicationDocument'>) {
        try {
            const applicationIdInt = parseInt(applicationId);
            if (isNaN(applicationIdInt)) {
                throw new BadRequest('INVALID_APPLICATION_ID', 'Invalid application ID', 'Application ID is not a number');
            }

            const userIdInt = parseInt(String(userId));
            if (isNaN(userIdInt)) {
                throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'User ID is not a number');
            }

            // Use transaction to ensure data consistency
            return await prisma.$transaction(async (tx) => {
                // Get the application with document count
                const application = await tx.application.findUnique({
                    where: {
                        id: applicationIdInt,
                        student: {
                            userId: userIdInt
                        }
                    },
                    select: {
                        ApplicationDocuments: {
                            ...filter,
                            include: {
                                document: true
                            }
                        }
                    }
                });

                if (!application) {
                    throw new BadRequest('APPLICATION_NOT_FOUND', 'Application not found', 'Application not found');
                }

                // Get total count using the same filter but without pagination
                const totalCount = await tx.applicationDocument.count({
                    where: {
                        applicationId: applicationIdInt,
                        application: {
                            student: {
                                userId: userIdInt
                            }
                        },
                        ...filter?.where
                    }
                });

                // Return both documents and total count
                return {
                    documents: application.ApplicationDocuments,
                    total: totalCount,
                    pageSize: filter?.take || application.ApplicationDocuments.length,
                    page: filter?.skip !== undefined && filter.take ? Math.floor(filter.skip / filter.take) + 1 : 1
                };
            });
        } catch (error) {
            logger.error(`Error getting application documents for application ${applicationId} and user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get extracted data for a specific document
     * @param documentId - The ID of the document
     * @param userId - The ID of the user requesting the data
     * @returns Promise containing the extracted data
     * @throws {BadRequest} When document is not found
     */
    public async getExtractedData(documentId: string, userId: string | number): Promise<Record<string, unknown>> {
        const job = await this.documentJobService.getJob(documentId);

        if (!job) {
            throw new BadRequest('DOCUMENT_NOT_FOUND', `Document with ID ${documentId} not found in primary store`, 'Tài liệu không tồn tại trong cơ sở dữ liệu chính');
        }

        if (job.userId !== userId) {
            throw new BadRequest('PERMISSION_DENIED', 'You do not have permission to access this document', 'Bạn không có quyền truy cập vào tài liệu này');
        }

        if (job.status !== DocumentProcessStatus.COMPLETED) {
            throw new BadRequest('PROCESSING_INCOMPLETE', `Document processing is ${job.status}`, `Tài liệu đang được xử lý, vui lòng chờ khiến tải lại trang`);
        }

        if (!job.result) {
            logger.warn(`Job ${job.id} is completed but has no result data.`);
            return {};
        }

        try {
            return JSON.parse(job.result);
        } catch (e) {
            logger.error(`Failed to parse result for job ${job.id}: ${job.result}`, e);
            throw new InternalServerError('RESULT_PARSE_ERROR', 'Failed to parse extracted data.', e.message);
        }
    }

    public async determineStudentLevel(parseData: TranscriptData): Promise<string> {
        return 'A';
    }

    /**
     * Verify extracted data
     * @param extractedDataId - The ID of the extracted data (same as document ID)
     * @param isVerified - Whether the data is verified as correct
     * @param userId - The ID of the user verifying the data
     * @returns Promise containing the updated job
     * @throws {BadRequest} When document is not found
     */
    public async verifyExtractedData(extractedDataId: string, type: 'transcript' | 'certificate', isVerified: boolean, userId: string | number): Promise<DocumentProcessJob<any>> {
        if (type === 'transcript') {
            return await this.verifyTranscript(extractedDataId, isVerified, userId);
        } else if (type === 'certificate') {
            return await this.verifyCertificate(extractedDataId, isVerified, userId);
        }
        throw new BadRequest('INVALID_DOCUMENT_TYPE', 'Invalid document type', 'Invalid document type');
    }

    public async verifyTranscript(extractedDataId: string, isVerified: boolean, userId: string | number): Promise<DocumentProcessJob<any>> {
        let job = await this.documentJobService.getJob(extractedDataId);

        if (!job) {
            // Fallback to queue data if not in primary job store (should ideally be consistent)
            // logger.warn(`Job ${extractedDataId} not found in DocumentJobService, attempting to fetch from queue.`);
            // job = await this.getJobById(extractedDataId);
            // if (job && typeof job.result === 'object') { // If from queue and result is object, stringify for consistency if needed later
            //     job.result = JSON.stringify(job.result);
            // }
            throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', `Document with ID ${extractedDataId} not found`);
        }

        if (job.status !== DocumentProcessStatus.COMPLETED) {
            throw new BadRequest('PROCESSING_INCOMPLETE', 'Processing incomplete', `Document processing is ${job.status}`);
        }

        let parsedResultData: Record<string, TranscriptData>;
        if (!job.result || typeof job.result !== 'string') {
            logger.error(`Job ${job.id} has no string result data for verification, or result is not a string.`);
            if (job.applicationDocumentId) {
                await prisma.applicationDocument.update({
                    where: { id: job.applicationDocumentId },
                    data: {
                        status: ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA,
                        rejectionReason: `${ApplicationFailedReasonMessage.DOCUMENT_PROCESSING_FAILED_INVALID_DATA} (Missing or invalid format extracted data string)`,
                        isEligible: false, verificationDate: new Date(),
                    },
                });
            }
            await this.updateJobStatus(job.id, DocumentProcessStatus.FAILED, null, 'Missing or invalid format extracted data string for verification');
            job.status = DocumentProcessStatus.FAILED;
            job.error = 'Missing or invalid format extracted data string for verification';
            return job;
        }

        try {
            parsedResultData = JSON.parse(job.result as string);
        } catch (e: any) {
            logger.error(`Failed to parse job.result for verification of job ${job.id}: ${job.result}`, e);
            if (job.applicationDocumentId) {
                await prisma.applicationDocument.update({
                    where: { id: job.applicationDocumentId },
                    data: {
                        status: ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA,
                        rejectionReason: `${ApplicationFailedReasonMessage.DOCUMENT_PROCESSING_FAILED_INVALID_DATA} (Error parsing extracted data: ${e.message})`,
                        isEligible: false, verificationDate: new Date(),
                    },
                });
            }
            await this.updateJobStatus(job.id, DocumentProcessStatus.FAILED, null, `Error parsing extracted data: ${e.message}`);
            job.status = DocumentProcessStatus.FAILED;
            job.error = `Error parsing extracted data: ${e.message}`;
            return job;
        }

        if (typeof parsedResultData !== 'object' || parsedResultData === null || Object.keys(parsedResultData).length === 0) {
            logger.error(`Job ${job.id} has empty parsed result data after JSON.parse.`);
            if (job.applicationDocumentId) {
                await prisma.applicationDocument.update({
                    where: { id: job.applicationDocumentId },
                    data: {
                        status: ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA,
                        rejectionReason: `${ApplicationFailedReasonMessage.DOCUMENT_PROCESSING_FAILED_INVALID_DATA} (Empty extracted data after parsing)`,
                        isEligible: false, verificationDate: new Date(),
                    },
                });
            }
            await this.updateJobStatus(job.id, DocumentProcessStatus.FAILED, null, 'Empty extracted data after parsing for verification');
            job.status = DocumentProcessStatus.FAILED;
            job.error = 'Empty extracted data after parsing for verification';
            return job;
        }

        let allEntriesValid = true;
        let validationErrorMessages: string[] = [];
        const transcriptDataRecords = parsedResultData;

        for (const key in transcriptDataRecords) {
            if (Object.prototype.hasOwnProperty.call(transcriptDataRecords, key)) {
                const transcriptEntry = transcriptDataRecords[key];
                const validationResult = ProcessServiceValidation.transcript.safeParse(transcriptEntry);

                if (!validationResult.success) {
                    allEntriesValid = false;
                    const fieldErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                    validationErrorMessages.push(`Entry '${key}': ${fieldErrors.join(', ')}`);
                    break;
                }
            }
        }

        if (!allEntriesValid) {
            const combinedErrorMessage = validationErrorMessages.join('; ');
            logger.warn(`Data validation failed for job ${job.id}: ${combinedErrorMessage}`);
            if (job.applicationDocumentId) {
                await prisma.applicationDocument.update({
                    where: { id: job.applicationDocumentId },
                    data: {
                        status: ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA,
                        rejectionReason: `${ApplicationFailedReasonMessage.DOCUMENT_PROCESSING_FAILED_INVALID_DATA}: ${combinedErrorMessage}`,
                        isEligible: false, verificationDate: new Date(),
                    },
                });
            }
            await this.updateJobStatus(job.id, DocumentProcessStatus.FAILED, null, combinedErrorMessage);
            job.status = DocumentProcessStatus.FAILED;
            job.error = combinedErrorMessage;
            return job;
        }

        if (job.fileId) {
            try {
                await prisma.extractedData.update({
                    where: { documentId: job.fileId },
                    data: { isVerified: isVerified, updatedAt: new Date() },
                });
            } catch (error) {
                logger.error(`Failed to update ExtractedData.isVerified for documentId ${job.fileId}:`, error);
            }
        } else {
            logger.warn(`Job ${job.id} does not have a fileId. Cannot update ExtractedData.isVerified.`);
        }

        if (job.applicationDocumentId) {
            await prisma.applicationDocument.update({
                where: { id: job.applicationDocumentId },
                data: {
                    status: isVerified ? DocumentProcessStatus.COMPLETED : ApplicationFailedReason.DOCUMENT_QUALITY_CHECK_FAILED,
                    rejectionReason: isVerified ? null : (ApplicationFailedReasonMessage.DOCUMENT_QUALITY_CHECK_FAILED + ' (Manually rejected by user)'),
                    isEligible: isVerified, verificationDate: new Date(),
                },
            });
        }

        const updatedJobDataForService = { ...job, updatedAt: new Date() };
        await this.documentJobService.updateJob(extractedDataId, updatedJobDataForService);

        return updatedJobDataForService;
    }

    public async verifyCertificate(extractedDataId: string, isVerified: boolean, userId: string | number): Promise<DocumentProcessJob<any>> {
        let jobToVerify = await this.documentJobService.getJob(extractedDataId);

        if (!jobToVerify) {
            // logger.warn(`Job ${extractedDataId} not found in DocumentJobService, attempting to fetch from queue.`);
            // jobToVerify = await this.getJobById(extractedDataId);
            throw new BadRequest('DOCUMENT_NOT_FOUND', 'Document not found', `Document with ID ${extractedDataId} not found`);
        }

        if (jobToVerify.status !== DocumentProcessStatus.COMPLETED) {
            throw new BadRequest('PROCESSING_INCOMPLETE', 'Processing incomplete', `Document processing is ${jobToVerify.status}`);
        }

        let parsedCertificateResult: CertificateProcessResult | null = null;
        if (jobToVerify.result && typeof jobToVerify.result === 'string') {
            try {
                parsedCertificateResult = JSON.parse(jobToVerify.result as string);
            } catch (e: any) {
                logger.error(`Failed to parse certificate job result for ${jobToVerify.id}: ${jobToVerify.result}`, e.message);
                throw new InternalServerError('RESULT_PARSE_ERROR', 'Failed to parse certificate data.', e.message);
            }
        } else if (jobToVerify.result && typeof jobToVerify.result === 'object') {
            // This case should ideally not happen if DocumentJobService.getJob always returns string result
            parsedCertificateResult = jobToVerify.result as any;
        }

        logger.info(`Verification for certificate ${jobToVerify.id} - Data: ${JSON.stringify(parsedCertificateResult || {})}, Verified: ${isVerified}`);

        if (jobToVerify.fileId) {
            try {
                await prisma.extractedData.update({
                    where: { documentId: jobToVerify.fileId },
                    data: { isVerified: isVerified, updatedAt: new Date() },
                });
            } catch (error) {
                logger.error(`Failed to update ExtractedData.isVerified for certificate documentId ${jobToVerify.fileId}:`, error);
            }
        }

        if (jobToVerify.applicationDocumentId) {
            await prisma.applicationDocument.update({
                where: { id: jobToVerify.applicationDocumentId },
                data: {
                    status: isVerified ? DocumentProcessStatus.COMPLETED : ApplicationFailedReason.DOCUMENT_QUALITY_CHECK_FAILED,
                    rejectionReason: isVerified ? null : (ApplicationFailedReasonMessage.DOCUMENT_QUALITY_CHECK_FAILED + ' (Manually rejected by user)'),
                    isEligible: isVerified, verificationDate: new Date(),
                },
            });
        }

        const updatedJobData = { ...jobToVerify, updatedAt: new Date() };
        await this.documentJobService.updateJob(extractedDataId, updatedJobData);

        return updatedJobData;
    }

    public parseExtractData(raw: TranscriptProcessResultDto): Record<string, TranscriptData> {
        const result: Record<string, TranscriptData> = {};

        for (const [className, data] of Object.entries(raw)) {
            if (!data.Tên || !data['Điểm']) {
                throw new Error(`Invalid data structure for ${className}`);
            }

            const processedData: TranscriptData = {
                ten: data.Tên,
                monHoc: data['Điểm'].map(m => ({
                    mon: m['Môn'],
                    muc: m['Mức'],
                    diem: m['Điểm'] === 'unk' ? null : Number(m['Điểm'])
                })),
            };

            if (data['Phẩm chất']) {
                processedData.phamChat = Object.entries(data['Phẩm chất']).reduce((acc, [k, v]) => ({
                    ...acc,
                    [VietnameseAccentConverter.toNonAccentVietnameseWithoutSpace(k)]: this.uniformPhamChat(v)
                }), {});
            }

            if (data['Năng lực']) {
                processedData.nangLuc = Object.entries(data['Năng lực']).reduce((acc, [k, v]) => ({
                    ...acc,
                    [VietnameseAccentConverter.toNonAccentVietnameseWithoutSpace(k)]: this.uniformPhamChat(v)
                }), {});
            }

            result[className] = processedData;
        }

        return result;
    }

    public uniformPhamChat(phamChat: string): string {
        switch (phamChat.toLowerCase()) {
            case 'tốt':
                return 'T';
            default:
                return phamChat;
        }
    }

    private normalizeKey(key: string): string {
        return key
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Helper method to get a job by ID from the queue
     * @param jobId - The ID of the job
     * @returns Promise containing the job or null if not found
     * @private
     */
    private async getJobById(jobId: string): Promise<DocumentProcessJob<any> | null> {
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
            } else {
                // Removed 'document-' check as it's not a defined prefix for these queues
                return null;
            }

            return job ? job.data as DocumentProcessJob<any> : null;
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

