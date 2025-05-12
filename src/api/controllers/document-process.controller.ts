import { Request, Response } from 'express';
import AsyncMiddleware from 'util/async-handler';
import Success from 'server/responses/success-response/success';
import BadRequest from 'server/responses/client-errors/bad-request';
import DocumentProcessService from 'services/document-process.service';
import {
    DocumentUploadRequest,
    ApplicationIdParam,
    DocumentIdParam,
    ExtractedDataIdParam,
    VerifyExtractedDataRequest
} from 'validations/document-process.validation';
import { PaginationQuery } from '../validations/pagination.validation';
import { transformExpressParamsForPrismaWithTimeRangeBase } from 'server/shared/helpers/pagination-parse';
import prisma from 'server/repositories/prisma';
import logger from 'util/logger';
import { DocumentProcessJob } from 'server/common/interfaces/document-process.interface';

export class DocumentProcessController {
    private documentProcessService: DocumentProcessService;

    constructor() {
        this.documentProcessService = new DocumentProcessService();
    }

    /**
     * Upload and process a document
     * @param req Express request object
     * @param res Express response object
     */
    uploadDocument = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, DocumentUploadRequest>, res: Response) => {
            try {
                const files = req.files as Express.Multer.File[];
            
                if (!files || files.length === 0) {
                    throw new BadRequest('INVALID_FILE', 'File is required', 'File is required');
                }

                const userId = req?.userId;
                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const applicationId = parseInt(req.body.applicationId, 10);
                
                // logger.info(`Processing document upload: Type=${req.body.type}, ApplicationID=${applicationId}, UserID=${userId}, File=${req.file.originalname}`);

                const results: { id: string, jobId?: string, status: string }[] = [];
                for (const file of files) {
                    const result = await this.documentProcessService.uploadAndProcessDocument(
                        file,
                        req.body.type,
                        applicationId,
                        userId,
                        req.body.metadata
                    );
                    results.push(result);
                }


                logger.info(`Document processed successfully: JobIDs=${results.map(result => result.jobId).join(', ')}`);

                const response = new Success(results).toJson;
                return res.status(201).json(response);
            } catch (error) {
                console.error('Error in uploadDocument:', error);
                throw error;
            }
        }
    );

    /**
     * Get all documents for a specific application
     * @param req Express request object
     * @param res Express response object
     */
    getApplicationDocuments = AsyncMiddleware.asyncHandler(
        async (req: Request<ApplicationIdParam, {}, {}, PaginationQuery>, res: Response) => {
            try {
                const { applicationId } = req.params;
                const userId = req?.userId;

                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const filter = transformExpressParamsForPrismaWithTimeRangeBase('applicationDocument', req.query, prisma);
               

                // Get documents with count using the filter
                const result = await this.documentProcessService.getApplicationDocuments(applicationId, userId, filter);
                
                const response = new Success({
                    data: result.documents,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.pageSize),
                    page: result.page,
                }).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in getApplicationDocuments:', error);
                throw error;
            }
        }
    );

    /**
     * Get extracted data for a specific document
     * @param req Express request object
     * @param res Express response object
     */
    getExtractedData = AsyncMiddleware.asyncHandler(
        async (req: Request<DocumentIdParam>, res: Response) => {
            try {
                const { documentId } = req.params;
                const userId = req?.userId;

                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const extractedData = await this.documentProcessService.getExtractedData(documentId, userId);
                const response = new Success(extractedData).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in getExtractedData:', error);
                throw error;
            }
        }
    );

    /**
     * Verify extracted data
     * @param req Express request object
     * @param res Express response object
     */
    verifyExtractedData = AsyncMiddleware.asyncHandler(
        async (req: Request<ExtractedDataIdParam, {}, VerifyExtractedDataRequest>, res: Response) => {
            try {
                const { extractedDataId } = req.params;
                const { isVerified, verificationNotes } = req.body;
                const userId = req?.userId;

                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const result = await this.documentProcessService.verifyExtractedData(
                    extractedDataId,
                    'transcript', // TODO: Get document type from database
                    isVerified,
                    userId
                );

                const response = new Success(result).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error in verifyExtractedData:', error);
                throw error;
            }
        }
    );
}