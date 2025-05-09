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
                if (!req.file) {
                    throw new BadRequest('INVALID_FILE', 'File is required', 'File is required');
                }

                const userId = req?.userId;
                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const result = await this.documentProcessService.uploadAndProcessDocument(
                    req.file,
                    req.body.type,
                    parseInt(req.body.applicationId, 10),
                    userId,
                    req.body.metadata
                );

                const response = new Success(result).toJson;
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
        async (req: Request<ApplicationIdParam>, res: Response) => {
            try {
                const { applicationId } = req.params;
                const userId = req?.userId;
                
                if (!userId) {
                    throw new BadRequest('INVALID_USER_ID', 'Invalid user ID', 'Invalid user ID');
                }

                const documents = await this.documentProcessService.getApplicationDocuments(applicationId, userId);
                const response = new Success(documents).toJson;
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