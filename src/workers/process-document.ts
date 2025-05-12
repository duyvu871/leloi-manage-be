import { Queue, QueueEvents } from 'bullmq';
import logger from 'util/logger';
import DocumentProcessService from 'services/document-process.service';
import appConfig from 'server/configs/app.config';
import emailConfig from 'server/configs/email.config';
import { TranscriptProcessResultDto, CertificateProcessResultDto } from 'server/common/dto/document-process.dto';
import DocumentJobService from 'server/api/services/document-job.service';
import prisma from 'repository/prisma';
import { NotificationServiceConfig, NotificationPayload } from 'server/common/interfaces/notification.service.interface';
import { UnifiedNotificationService } from 'server/api/services/notification.service';
import { PrismaClient } from '@prisma/client';
import { DocumentProcessJob, TranscriptData } from 'server/common/interfaces/document-process.interface';
import { ApplicationFailedReason } from 'server/common/enums/services/document-process.enum';

/**
 * ProcessDocumentWorker class
 * 
 * This worker listens for events from document processing queues
 * and handles document processing tasks using DocumentProcessService
 */
export default class ProcessDocumentWorker {
    private notificationService: UnifiedNotificationService;
    private documentService: DocumentProcessService;
    private documentJobService: DocumentJobService;
    private transcriptQueueEvents: QueueEvents;
    private certificateQueueEvents: QueueEvents;
    private isRunning: boolean = false;
    private adminRecipientId: string;
    private metrics: {
        processedJobs: number;
        failedJobs: number;
        processingTime: number[];
    };

    /**
     * Initialize the document processing worker
     */
    constructor() {
        if (!appConfig.recipientId) {
            throw new Error('Recipient ID is not configured');
        }
        this.adminRecipientId = appConfig.recipientId;

        // Initialize notification service with all channels
        const notificationConfig: NotificationServiceConfig = {
            telegram: appConfig.telegramBotToken ? {
                botToken: appConfig.telegramBotToken,
                defaultRecipientId: this.adminRecipientId
            } : undefined,
            email: {
                from: emailConfig.from.address,
                smtp: {
                    host: emailConfig.host,
                    port: emailConfig.port,
                    secure: emailConfig.secure,
                    auth: {
                        user: emailConfig.auth.user,
                        pass: emailConfig.auth.pass || ''
                    }
                }
            },
            defaultChannels: ['DATABASE', 'EMAIL', 'TELEGRAM']
        };
        this.notificationService = new UnifiedNotificationService(notificationConfig);

        // Initialize other services
        this.documentService = new DocumentProcessService('consumer');
        this.documentJobService = new DocumentJobService();

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

        // Add event listeners for job initialization
        this.transcriptQueueEvents.on('active', async ({ jobId }) => {
            try {
                const job = await this.documentJobService.getJob(jobId);
                if (job) {
                    await sendJobInitializationNotification(
                        this.notificationService,
                        jobId,
                        job,
                        'transcript',
                        this.adminRecipientId,
                        prisma
                    );
                }
            } catch (error) {
                logger.error(`Error handling transcript job activation for ${jobId}:`, error);
            }
        });

        this.certificateQueueEvents.on('active', async ({ jobId }) => {
            try {
                const job = await this.documentJobService.getJob(jobId);
                if (job) {
                    await sendJobInitializationNotification(
                        this.notificationService,
                        jobId,
                        job,
                        'certificate',
                        this.adminRecipientId,
                        prisma
                    );
                }
            } catch (error) {
                logger.error(`Error handling certificate job activation for ${jobId}:`, error);
            }
        });

        // Initialize metrics
        this.metrics = {
            processedJobs: 0,
            failedJobs: 0,
            processingTime: []
        };

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
        this.transcriptQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
            try {
                console.log(`--------------------Transcript job ${jobId} completed!--------------------`);
                const result = returnvalue as unknown as TranscriptProcessResultDto;
                const job = await this.documentJobService.getJob(jobId);
                console.log('job', job);

                if (!job) {
                    logger.error(`Transcript job ${jobId} not found in DocumentJobService`);
                    return;
                }

                const jobDataFromQueue = job as DocumentProcessJob<any>;
                const transcriptProcessingResult = result as unknown as Record<string, TranscriptData>;
                const jobDataForNotification = jobDataFromQueue;

                const formattedMessage = await formatTranscriptCompletionMessage(
                    jobId,
                    jobDataForNotification,
                    transcriptProcessingResult,
                    prisma
                );

                const applicationDocument = await prisma.applicationDocument.findUnique({
                    where: {
                        id: job.applicationDocumentId
                    }
                });

                const user = await prisma.user.findUnique({
                    where: {
                        id: job.userId
                    },
                    select: {
                        email: true,
                        students: {
                            select: {
                                registration: {
                                    select: {
                                        fullName: true,
                                        dateOfBirth: true,
                                        primarySchool: true,
                                    }
                                }
                            }
                        }
                    }
                }); 
                
                console.log('applicationDocument', applicationDocument);

                // Send notification through all channels
                const notificationPayload: NotificationPayload = {
                    title: 'Xử lý Học bạ Hoàn tất',
                    message: formattedMessage,
                    htmlContent: generateTranscriptHtmlContent(user, transcriptProcessingResult),
                    description: `Kết quả xử lý học bạ của học sinh ${user?.students?.[0]?.registration?.fullName || 'Chưa cập nhật'}. Vui lòng kiểm tra thông tin và phản hồi nếu có sai sót.`,
                    type: 'DOCUMENT',
                    priority: 'HIGH',
                    channels: ['DATABASE', 'EMAIL', 'TELEGRAM'],
                    metadata: {
                        jobId,
                        userId: job.userId,
                        documentType: 'Học bạ',
                        result: transcriptProcessingResult
                    }
                };

                await this.notificationService.sendNotification(
                    job.userId,
                    notificationPayload,
                    { parseMode: 'MarkdownV2' }
                );

                if (!user || !user.students || user.students.length === 0 || !user.students[0].registration) {
                    logger.error(`User ${job.userId} not found or does not have a student registration`);
                    await this.notificationService.sendNotification(
                        this.adminRecipientId,
                        {
                            title: 'Lỗi Xử lý Hồ sơ',
                            message: `User ${job.userId} không tìm thấy hoặc chưa có thông tin học sinh`,
                            type: 'SYSTEM',
                            priority: 'HIGH',
                            channels: ['TELEGRAM'],
                            metadata: {
                                jobId,
                                userId: job.userId,
                                documentType: 'Học bạ',
                                error: 'Missing student registration'
                            }
                        }
                    );
                }

                this.metrics.processedJobs++;
                this.logMetrics();
            } catch (error) {
                logger.error(`Error processing transcript job ${jobId}:`, error);
                this.metrics.failedJobs++;

                let errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED;
                let errorMessage = 'Lỗi không xác định khi xử lý học bạ';
                let detailedError = error instanceof Error ? error.message : String(error);

                // Phân loại lỗi
                if (error instanceof Error) {
                    if (error.message.includes('Invalid data structure') || error.message.includes('data validation failed')) {
                        errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA;
                        errorMessage = 'Tài liệu thiếu dữ liệu hoặc dữ liệu không hợp lệ. Vui lòng quét lại đúng định dạng.';
                    } else if (error.message.includes('upload failed') || error.message.includes('file not found')) {
                        errorStatus = ApplicationFailedReason.DOCUMENT_UPLOAD_FAILED;
                        errorMessage = 'Tải lên tài liệu thất bại. Vui lòng thử lại.';
                    } else if (error.message.includes('invalid format') || error.message.includes('invalid file type')) {
                        errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_FORMAT;
                        errorMessage = 'Định dạng tài liệu không hợp lệ. Vui lòng sử dụng file PDF đúng định dạng.';
                    } else if (error.message.includes('information missing')) {
                        errorStatus = ApplicationFailedReason.DOCUMENT_INFORMATION_MISSING;
                        errorMessage = 'Thiếu thông tin quan trọng trong tài liệu. Vui lòng kiểm tra và quét lại.';
                    }
                }

                // Cập nhật trạng thái trong DB
                try {
                    if (jobId) {
                        const job = await this.documentJobService.getJob(jobId);
                        if (job?.applicationDocumentId) {
                            await prisma.applicationDocument.update({
                                where: { id: job.applicationDocumentId },
                                data: {
                                    status: errorStatus,
                                    rejectionReason: `${errorMessage}\nChi tiết: ${detailedError}`,
                                    isEligible: false,
                                    verificationDate: new Date()
                                }
                            });
                        }
                    }
                } catch (dbError) {
                    logger.error('Failed to update application document status:', dbError);
                }

                // Gửi thông báo lỗi
                await this.notificationService.sendNotification(
                    this.adminRecipientId,
                    {
                        title: 'Lỗi Xử lý Hồ sơ',
                        message: errorMessage,
                        description: detailedError,
                        type: 'SYSTEM',
                        priority: 'HIGH',
                        metadata: {
                            jobId,
                            documentType: 'Học bạ',
                            errorStatus,
                            error: detailedError
                        }
                    }
                );
            }
        });

        this.transcriptQueueEvents.on('failed', async ({ jobId, failedReason }) => {
            logger.error(`Transcript job ${jobId} failed with error: ${failedReason}`);
            this.metrics.failedJobs++;

            try {
                // Retrieve job data if possible
                const job = await this.documentJobService.getJob(jobId);
                
                let errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED;
                let errorMessage = 'Xử lý học bạ thất bại';

                // Phân loại lỗi từ failedReason
                if (failedReason.includes('Invalid data structure') || failedReason.includes('data validation failed')) {
                    errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_DATA;
                    errorMessage = 'Tài liệu thiếu dữ liệu hoặc dữ liệu không hợp lệ. Vui lòng quét lại đúng định dạng.';
                } else if (failedReason.includes('upload failed') || failedReason.includes('file not found')) {
                    errorStatus = ApplicationFailedReason.DOCUMENT_UPLOAD_FAILED;
                    errorMessage = 'Tải lên tài liệu thất bại. Vui lòng thử lại.';
                } else if (failedReason.includes('invalid format') || failedReason.includes('invalid file type')) {
                    errorStatus = ApplicationFailedReason.DOCUMENT_PROCESSING_FAILED_INVALID_FORMAT;
                    errorMessage = 'Định dạng tài liệu không hợp lệ. Vui lòng sử dụng file PDF đúng định dạng.';
                } else if (failedReason.includes('information missing')) {
                    errorStatus = ApplicationFailedReason.DOCUMENT_INFORMATION_MISSING;
                    errorMessage = 'Thiếu thông tin quan trọng trong tài liệu. Vui lòng kiểm tra và quét lại.';
                }
                
                // Prepare error metadata
                let errorMetadata: Record<string, any> = {
                    jobId,
                    documentType: 'Học bạ',
                    errorStatus,
                    error: failedReason,
                    timestamp: new Date().toISOString()
                };
                
                // Add job data to metadata if available
                if (job) {
                    errorMetadata = {
                        ...errorMetadata,
                        userId: job.userId,
                        applicationDocumentId: job.applicationDocumentId,
                        fileName: job.fileName || 'Unknown'
                    };
                    
                    // Enhanced error message
                    const detailedErrorMessage = `Transcript job processing failed:\n\n` +
                        `Job ID: ${jobId}\n` +
                        `Error status: ${errorStatus}\n` +
                        `User ID: ${job.userId}\n` +
                        `Application Doc ID: ${job.applicationDocumentId}\n` +
                        `File name: ${job.fileName || 'Unknown'}\n\n` +
                        `Error message: ${errorMessage}\n` +
                        `Raw error: ${failedReason}`;

                    // Cập nhật trạng thái trong DB
                    try {
                        if (job.applicationDocumentId) {
                            await prisma.applicationDocument.update({
                                where: { id: job.applicationDocumentId },
                                data: {
                                    status: errorStatus,
                                    rejectionReason: `${errorMessage}\nChi tiết: ${failedReason}`,
                                    isEligible: false,
                                    verificationDate: new Date()
                                }
                            });
                        }
                    } catch (dbError) {
                        logger.error('Failed to update application document status:', dbError);
                    }
                    
                    // Gửi thông báo lỗi chi tiết hơn
                    await this.notificationService.sendNotification(
                        this.adminRecipientId,
                        {
                            title: 'Lỗi Xử lý Hồ sơ',
                            message: detailedErrorMessage,
                            description: failedReason,
                            type: 'SYSTEM',
                            priority: 'HIGH',
                            channels: ['TELEGRAM'],
                            metadata: errorMetadata
                        }
                    );
                } else {
                    // Gửi thông báo lỗi cơ bản nếu không có job data
                    await this.notificationService.sendNotification(
                        this.adminRecipientId,
                        {
                            title: 'Lỗi Xử lý Hồ sơ',
                            message: errorMessage,
                            description: failedReason,
                            type: 'SYSTEM',
                            priority: 'HIGH',
                            channels: ['TELEGRAM'],
                            metadata: errorMetadata
                        }
                    );
                }
            } catch (error) {
                logger.error(`Failed to send error notification for job ${jobId}:`, error);
                
                // Fallback notification
                await this.notificationService.sendNotification(
                    this.adminRecipientId,
                    {
                        title: 'Lỗi Xử lý Hồ sơ',
                        message: `Transcript job ${jobId} failed: ${failedReason}\nError sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        type: 'SYSTEM',
                        priority: 'HIGH',
                        channels: ['TELEGRAM']
                    }
                );
            }
        });

        // Set up event listeners for certificate queue
        this.certificateQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
            try {
                console.log(`--------------------Certificate job ${jobId} completed!--------------------`);
                const result = returnvalue as unknown as CertificateProcessResultDto;
                const job = await this.documentJobService.getJob(jobId);
                console.log('job', job);

                if (!job) {
                    logger.error(`Certificate job ${jobId} not found in DocumentJobService`);
                    return;
                }

                const jobDataFromQueue = job as DocumentProcessJob<any>;
                const certificateProcessingResult = result;
                const jobDataForNotification = jobDataFromQueue;

                const formattedMessage = await formatCertificateCompletionMessage(
                    jobId,
                    jobDataForNotification,
                    certificateProcessingResult,
                    prisma
                );

                const applicationDocument = await prisma.applicationDocument.findUnique({
                    where: {
                        id: job.applicationDocumentId
                    }
                });

                const user = await prisma.user.findUnique({
                    where: {
                        id: job.userId
                    },
                    select: {
                        email: true,
                        students: {
                            select: {
                                registration: {
                                    select: {
                                        fullName: true,
                                        dateOfBirth: true,
                                        primarySchool: true,
                                    }
                                }
                            }
                        }
                    }
                });

                console.log('applicationDocument', applicationDocument);

                // await this.notificationService.sendNotification(
                //     job.userId,
                //     {
                //         title: 'Xử lý Chứng chỉ/Chứng nhận Hoàn tất',
                //         message: formattedMessage,
                //         type: 'DOCUMENT',
                //         priority: 'HIGH',
                //         metadata: {
                //             jobId,
                //             userId: job.userId,
                //             documentType: 'certificate',
                //             result: certificateProcessingResult
                //         }
                //     },
                //     { parseMode: 'MarkdownV2' }
                // );

                if (user && user.students && user.students.length > 0 && user.students[0].registration) {
                    await this.notificationService.sendNotification(
                        job.userId,
                        {
                            title: 'Xử lý Chứng chỉ/Chứng nhận Hoàn tất',
                            message: formattedMessage,
                            type: 'DOCUMENT',
                            priority: 'HIGH',
                            metadata: {
                                jobId,
                                userId: job.userId,
                                documentType: 'certificate',
                                result: certificateProcessingResult
                            }
                        },
                        { parseMode: 'MarkdownV2' }
                    );
                } else {
                    logger.error(`User ${job.userId} not found or does not have a student registration`);
                    await this.notificationService.sendNotification(
                        this.adminRecipientId,
                        {
                            title: 'Lỗi Xử lý Hồ sơ',
                            message: `User ${job.userId} không tìm thấy hoặc chưa có thông tin học sinh`,
                            type: 'SYSTEM',
                            priority: 'HIGH',
                            channels: ['TELEGRAM'],
                            metadata: {
                                jobId,
                                userId: job.userId,
                                documentType: 'certificate',
                                error: 'Missing student registration'
                            }   
                        }
                    );
                }

                this.metrics.processedJobs++;
                // Only add processing time if it exists in the result
                const resultWithTime = result as unknown as { processingTime?: number };
                if (resultWithTime.processingTime) {
                    this.metrics.processingTime.push(resultWithTime.processingTime);
                }

                this.logMetrics();
            } catch (error) {
                logger.error(`Error processing certificate job ${jobId}:`, error);
                this.metrics.failedJobs++;

                // Send error notification
                await this.notificationService.sendNotification(
                    this.adminRecipientId,
                    {
                        title: 'Document Processing Error',
                        message: `Error processing certificate job ${jobId}: ${error}`,
                        type: 'SYSTEM',
                        priority: 'HIGH'
                    }
                );
            }
        });

        this.certificateQueueEvents.on('failed', async ({ jobId, failedReason }) => {
            logger.error(`Certificate job ${jobId} failed with error: ${failedReason}`);
            this.metrics.failedJobs++;

            try {
                // Retrieve job data if possible
                const job = await this.documentJobService.getJob(jobId);
                
                // Prepare detailed error message
                let errorMessageTitle = 'Document Processing Error';
                let errorMessage = `Certificate job ${jobId} failed with error: ${failedReason}`;
                let errorMetadata: Record<string, any> = {
                    jobId,
                    documentType: 'certificate',
                    error: failedReason
                };
                
                // Add job data to metadata if available
                if (job) {
                    errorMetadata = {
                        ...errorMetadata,
                        userId: job.userId,
                        applicationDocumentId: job.applicationDocumentId,
                        fileName: job.fileName || 'Unknown',
                        timestamp: new Date().toISOString()
                    };
                    
                    errorMessage = `Certificate job processing failed:\n\n` +
                        `Job ID: ${jobId}\n` +
                        `User ID: ${job.userId}\n` +
                        `Application Doc ID: ${job.applicationDocumentId}\n` +
                        `File name: ${job.fileName || 'Unknown'}\n\n` +
                        `Error: ${failedReason}`;
                }

                // Send error notification
                await this.notificationService.sendNotification(
                    this.adminRecipientId,
                    {
                        title: errorMessageTitle,
                        message: errorMessage,
                        type: 'SYSTEM',
                        priority: 'HIGH',
                        channels: ['TELEGRAM'],
                        metadata: errorMetadata
                    }
                );
            } catch (error) {
                logger.error(`Failed to send error notification for job ${jobId}:`, error);
            }
        });

        this.isRunning = true;
        logger.info('Document processing worker started');
    }

    /**
     * Log current metrics
     */
    private logMetrics(): void {
        const avgProcessingTime = this.metrics.processingTime.length > 0
            ? this.metrics.processingTime.reduce((a, b) => a + b, 0) / this.metrics.processingTime.length
            : 0;

        logger.info('Worker metrics:', {
            processedJobs: this.metrics.processedJobs,
            failedJobs: this.metrics.failedJobs,
            avgProcessingTime: `${avgProcessingTime.toFixed(2)}ms`
        });
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

// Helper function to escape special characters for Telegram MarkdownV2
function escapeMarkdownV2(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function formatTranscriptCompletionMessage(
    jobId: string,
    jobData: DocumentProcessJob<any>,
    transcriptResult: Record<string, TranscriptData>,
    prisma: PrismaClient
): Promise<string> {
    let message = `🔔 *${escapeMarkdownV2('Xử lý Học bạ Hoàn tất')}* 🔔\n\n`;
    message += `*Job ID:* \`${escapeMarkdownV2(jobId)}\`\n`;
    if (jobData.fileName) {
        message += `*Tên file:* \`${escapeMarkdownV2(jobData.fileName)}\`\n`;
    }
    if (jobData.userId) {
        message += `*User ID:* \`${escapeMarkdownV2(String(jobData.userId))}\`\n`;
    }

    if (jobData.applicationDocumentId) {
        try {
            const appDoc = await prisma.applicationDocument.findUnique({
                where: { id: jobData.applicationDocumentId },
                include: {
                    application: {
                        include: {
                            student: {
                                include: {
                                    registration: true,
                                }
                            }
                        }
                    }
                }
            });

            if (appDoc) {
                message += `*Ngày tải lên:* \`${escapeMarkdownV2(new Date(appDoc.createdAt).toLocaleString('vi-VN'))}\`\n`;
                const studentReg = appDoc.application?.student?.registration;
                if (studentReg) {
                    message += `*Học sinh:* \`${escapeMarkdownV2(studentReg.fullName || 'N/A')}\`\n`;
                    if (studentReg.dateOfBirth) {
                        message += `*Ngày sinh:* \`${escapeMarkdownV2(new Date(studentReg.dateOfBirth).toLocaleDateString('vi-VN'))}\`\n`;
                    }
                    if (studentReg.primarySchool) {
                        message += `*Trường Tiểu học:* \`${escapeMarkdownV2(studentReg.primarySchool)}\`\n`;
                    }
                } else {
                    message += `*Thông tin học sinh:* ${escapeMarkdownV2('Không tìm thấy')}\n`;
                }
            } else {
                message += `*Thông tin tài liệu ứng tuyển \\(ID: ${escapeMarkdownV2(String(jobData.applicationDocumentId))}\\):* ${escapeMarkdownV2('Không tìm thấy')}\n`;
            }
        } catch (e: any) {
            logger.error(`Error fetching student/application details for notification: ${e.message}`);
            message += `*Lỗi khi lấy thông tin HS:* \`${escapeMarkdownV2(e.message)}\`\n`;
        }
    } else {
        message += `*ApplicationDocument ID:* ${escapeMarkdownV2('Không được cung cấp trong jobData.')}\n`;
    }

    message += `\n📖 *${escapeMarkdownV2('Kết quả Trích xuất Chi tiết')}:*\n`;

    if (transcriptResult && Object.keys(transcriptResult).length > 0) {
        for (const className in transcriptResult) {
            const data = transcriptResult[className];
            message += `\n📚 _${escapeMarkdownV2('Lớp: ' + className)}_\n`;
            if (data.ten) {
                message += `  *${escapeMarkdownV2('Tên trong bảng điểm:')}* \`${escapeMarkdownV2(data.ten)}\`\n`;
            }
            message += `  *${escapeMarkdownV2('Chi tiết môn học')}:*\n`;
            message += "\`\`\`\n";
            message += escapeMarkdownV2("Môn học                  | Mức  | Điểm\n");
            message += escapeMarkdownV2("--------------------------|------|------\n");
            if (data.monHoc && data.monHoc.length > 0) {
                data.monHoc.forEach(mon => {
                    const monNamePadded = (mon.mon || 'N/A').padEnd(26);
                    const mucPadded = (mon.muc || 'N/A').padEnd(4);
                    const diemStr = mon.diem !== null && typeof mon.diem !== 'undefined' ? String(mon.diem) : 'N/A';
                    message += escapeMarkdownV2(`${monNamePadded} | ${mucPadded} | ${diemStr.padEnd(5)}\n`);
                });
            } else {
                message += escapeMarkdownV2("Không có thông tin môn học cho lớp này.\n");
            }
            message += "\`\`\`\n";
        }
    } else {
        message += `\`${escapeMarkdownV2('Không có dữ liệu trích xuất hoặc kết quả rỗng.')}\`\n`;
    }

    message += `\n${escapeMarkdownV2('---')}\n_${escapeMarkdownV2('Thời gian thông báo: ' + new Date().toLocaleString('vi-VN'))}_`;

    return message;
}

// Helper function to format certificate completion message
async function formatCertificateCompletionMessage(
    jobId: string,
    jobData: DocumentProcessJob<any>,
    certificateResult: any,
    prisma: PrismaClient
): Promise<string> {
    let message = `🔔 *${escapeMarkdownV2('Xử lý Chứng chỉ/Chứng nhận Hoàn tất')}* 🔔\n\n`;
    message += `*Job ID:* \`${escapeMarkdownV2(jobId)}\`\n`;
    if (jobData.fileName) {
        message += `*Tên file:* \`${escapeMarkdownV2(jobData.fileName)}\`\n`;
    }
    if (jobData.userId) {
        message += `*User ID:* \`${escapeMarkdownV2(String(jobData.userId))}\`\n`;
    }

    if (jobData.applicationDocumentId) {
        try {
            const appDoc = await prisma.applicationDocument.findUnique({
                where: { id: jobData.applicationDocumentId },
                include: {
                    application: {
                        include: {
                            student: {
                                include: {
                                    registration: true,
                                }
                            }
                        }
                    }
                }
            });

            if (appDoc) {
                message += `*Ngày tải lên:* \`${escapeMarkdownV2(new Date(appDoc.createdAt).toLocaleString('vi-VN'))}\`\n`;
                const studentReg = appDoc.application?.student?.registration;
                if (studentReg) {
                    message += `*Học sinh:* \`${escapeMarkdownV2(studentReg.fullName || 'N/A')}\`\n`;
                    if (studentReg.dateOfBirth) {
                        message += `*Ngày sinh:* \`${escapeMarkdownV2(new Date(studentReg.dateOfBirth).toLocaleDateString('vi-VN'))}\`\n`;
                    }
                    if (studentReg.primarySchool) {
                        message += `*Trường Tiểu học:* \`${escapeMarkdownV2(studentReg.primarySchool)}\`\n`;
                    }
                } else {
                    message += `*Thông tin học sinh:* ${escapeMarkdownV2('Không tìm thấy')}\n`;
                }
            } else {
                message += `*Thông tin tài liệu ứng tuyển \\(ID: ${escapeMarkdownV2(String(jobData.applicationDocumentId))}\\):* ${escapeMarkdownV2('Không tìm thấy')}\n`;
            }
        } catch (e: any) {
            logger.error(`Error fetching student/application details for notification: ${e.message}`);
            message += `*Lỗi khi lấy thông tin HS:* \`${escapeMarkdownV2(e.message)}\`\n`;
        }
    } else {
        message += `*ApplicationDocument ID:* ${escapeMarkdownV2('Không được cung cấp trong jobData.')}\n`;
    }

    message += `\n📖 *${escapeMarkdownV2('Kết quả Trích xuất Chi tiết')}:*\n`;

    if (certificateResult) {
        message += `\`\`\`\n${escapeMarkdownV2(JSON.stringify(certificateResult, null, 2))}\`\`\`\n`;
    } else {
        message += `\`${escapeMarkdownV2('Không có dữ liệu trích xuất hoặc kết quả rỗng.')}\`\n`;
    }

    message += `\n${escapeMarkdownV2('---')}\n_${escapeMarkdownV2('Thời gian thông báo: ' + new Date().toLocaleString('vi-VN'))}_`;

    return message;
}

/**
 * Generates HTML content for transcript notification
 * @param user - User data with student information
 * @param transcriptResult - Processed transcript data
 * @returns HTML string
 */
function generateTranscriptHtmlContent(
    user: { 
        email?: string;
        students?: Array<{ 
            registration: { 
                fullName: string; 
                dateOfBirth: Date; 
                primarySchool: string; 
            } | null;
        }>;
    } | null,
    transcriptResult: Record<string, TranscriptData>
): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Kết quả Xử lý Học bạ</h2>
    
    ${generateStudentInfoSection(user)}
    ${generateTranscriptSection(transcriptResult)}
    ${generateInstructionSection()}
    ${generateFooterSection()}
</div>`;
}

/**
 * Generates the student information section
 */
function generateStudentInfoSection(user: { 
    email?: string;
    students?: Array<{ 
        registration: { 
            fullName: string; 
            dateOfBirth: Date; 
            primarySchool: string; 
        } | null;
    }>;
} | null): string {
    return `
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Thông tin Học sinh:</h3>
        <ul style="color: #34495e; line-height: 1.6;">
            <li>Họ và tên: <strong>${user?.students?.[0]?.registration?.fullName || 'Chưa cập nhật'}</strong></li>
            <li>Ngày sinh: <strong>${user?.students?.[0]?.registration?.dateOfBirth ? new Date(user.students[0].registration.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong></li>
            <li>Trường tiểu học: <strong>${user?.students?.[0]?.registration?.primarySchool || 'Chưa cập nhật'}</strong></li>
        </ul>
    </div>`;
}

/**
 * Generates the transcript data section with grades table
 */
function generateTranscriptSection(transcriptResult: Record<string, TranscriptData>): string {
    return `
    <div style="margin: 20px 0;">
        <h3 style="color: #2c3e50;">Bảng điểm chi tiết:</h3>
        ${Object.entries(transcriptResult).map(([className, data]) => `
            <div style="margin-bottom: 30px;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    Lớp ${className}
                </h4>
                
                ${generateGradesTable(data)}
                ${generatePhamChatSection(data.phamChat)}
                ${generateNangLucSection(data.nangLuc)}
            </div>
        `).join('')}
    </div>`;
}

/**
 * Generates the grades table for a specific class
 */
function generateGradesTable(data: TranscriptData): string {
    return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
            <tr style="background-color: #3498db; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Môn học</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Mức đánh giá</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Điểm số</th>
            </tr>
        </thead>
        <tbody>
            ${data.monHoc.map(mon => `
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd;">${mon.mon}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${getMucColor(mon.muc)};">
                        ${mon.muc || 'N/A'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                        ${mon.diem !== null ? mon.diem : 'N/A'}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}

/**
 * Generates the "Phẩm chất" section if available
 */
function generatePhamChatSection(phamChat?: Record<string, string>): string {
    if (!phamChat) return '';

    console.log(Object.entries(phamChat).map(([key, value]) => `${key}: ${value}`));
    

    return `
    <div style="margin-top: 15px;">
        <h5 style="color: #2c3e50;">Phẩm chất:</h5>
        <ul style="list-style: none; padding-left: 0;">
            ${Object.entries(phamChat).map(([key, value]) => value ? `
                <li style="margin: 5px 0; padding: 8px; background-color: ${getPhamChatColor(value)}; border-radius: 4px;">
                    ${key}: <strong>${value}</strong>
                </li>
            ` : '').join('')}
        </ul>
    </div>`;
}

/**
 * Generates the "Năng lực" section if available
 */
function generateNangLucSection(nangLuc?: Record<string, string>): string {
    if (!nangLuc) return '';
    return `
    <div style="margin-top: 15px;">
        <h5 style="color: #2c3e50;">Năng lực:</h5>
        <ul style="list-style: none; padding-left: 0;">
            ${Object.entries(nangLuc).map(([key, value]) => value ? `
                <li style="margin: 5px 0; padding: 8px; background-color: ${getNangLucColor(value)}; border-radius: 4px;">
                    ${key}: <strong>${value}</strong>
                </li>
            ` : '' ).join('')}
        </ul>
    </div>`;
}

/**
 * Generates the instruction section
 */
function generateInstructionSection(): string {
    return `
    <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Hướng dẫn:</h3>
        <ol style="color: #34495e; line-height: 1.6;">
            <li>Vui lòng kiểm tra kỹ thông tin học sinh và kết quả học tập được trích xuất.</li>
            <li>Nếu phát hiện bất kỳ sai sót nào, hãy thông báo ngay cho nhà trường.</li>
            <li>Để xem chi tiết hoặc tải về bản gốc, vui lòng đăng nhập vào hệ thống.</li>
            <li>Nếu cần hỗ trợ thêm, vui lòng liên hệ với nhà trường qua:</li>
        </ol>
        <div style="margin-top: 10px; padding: 10px; background-color: #fff; border-radius: 4px;">
            <p style="margin: 5px 0;">📞 Hotline: <strong>0123 456 789</strong></p>
            <p style="margin: 5px 0;">📧 Email: <strong>support@leloi.edu.vn</strong></p>
        </div>
    </div>`;
}

/**
 * Generates the footer section
 */
function generateFooterSection(): string {
    return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
        <p>Đây là email tự động, vui lòng không trả lời email này.</p>
        <p>© ${new Date().getFullYear()} Trường THCS Lê Lợi. All rights reserved.</p>
    </div>`;
}

// Helper functions for color coding
function getMucColor(muc: string | null): string {
    switch (muc?.toLowerCase()) {
        case 'tốt':
        case 't':
            return '#e3f2fd'; // Light Blue
        case 'khá':
        case 'k':
            return '#e8f5e9'; // Light Green
        case 'đạt':
        case 'đ':
            return '#fff3e0'; // Light Orange
        case 'chưa đạt':
        case 'cđ':
            return '#ffebee'; // Light Red
        default:
            return '#ffffff'; // White
    }
}

function getPhamChatColor(value: string): string {
    switch (value.toLowerCase()) {
        case 'tốt':
            return '#e3f2fd';
        case 'đạt':
            return '#e8f5e9';
        case 'cần cố gắng':
            return '#fff3e0';
        default:
            return '#ffffff';
    }
}

function getNangLucColor(value: string): string {
    switch (value.toLowerCase()) {
        case 'tốt':
            return '#e3f2fd';
        case 'đạt':
            return '#e8f5e9';
        case 'cần cố gắng':
            return '#fff3e0';
        default:
            return '#ffffff';
    }
}

// Add this helper function before the ProcessDocumentWorker class
async function sendJobInitializationNotification(
    notificationService: UnifiedNotificationService,
    jobId: string,
    jobData: DocumentProcessJob<any>,
    jobType: 'transcript' | 'certificate',
    adminRecipientId: string,
    prisma: PrismaClient
): Promise<void> {
    try {
        let message = `🔄 *${escapeMarkdownV2(`Bắt đầu Xử lý ${jobType === 'transcript' ? 'Học bạ' : 'Chứng chỉ'}`)}* 🔄\n\n`;
        
        // Job Information
        message += `*Job ID:* \`${escapeMarkdownV2(jobId)}\`\n`;
        message += `*Document Type:* \`${escapeMarkdownV2(jobType)}\`\n`;
        
        // Job Data
        if (jobData.fileName) {
            message += `*File Name:* \`${escapeMarkdownV2(jobData.fileName)}\`\n`;
        }
        if (jobData.userId) {
            message += `*User ID:* \`${escapeMarkdownV2(String(jobData.userId))}\`\n`;
        }
        if (jobData.applicationDocumentId) {
            message += `*Application Document ID:* \`${escapeMarkdownV2(String(jobData.applicationDocumentId))}\`\n`;
        }

        // Status and Timestamp
        message += `\n⏳ *${escapeMarkdownV2('Trạng thái:')}* \`${escapeMarkdownV2('Đang xử lý...')}\`\n`;
        message += `\n${escapeMarkdownV2('---')}\n`;
        message += `_${escapeMarkdownV2('Thời gian bắt đầu: ' + new Date().toLocaleString('vi-VN'))}_`;

        await notificationService.sendNotification(
            adminRecipientId,
            {
                title: `Bắt đầu Xử lý ${jobType === 'transcript' ? 'Học bạ' : 'Chứng chỉ'}`,
                message,
                type: 'SYSTEM',
                priority: 'NORMAL',
                channels: ['TELEGRAM'],
                metadata: {
                    jobId,
                    userId: jobData.userId,
                    fileName: jobData.fileName,
                    applicationDocumentId: jobData.applicationDocumentId,
                    documentType: jobType,
                    status: 'initializing',
                    startTime: new Date().toISOString()
                }
            },
            { parseMode: 'MarkdownV2' }
        );
    } catch (error) {
        logger.error(`Error sending initialization notification for job ${jobId}:`, error);
    }
}