import { Request, Response } from 'express';
import { 
    GetDocumentByIdParams, 
    GetApplicationDocumentsParams, 
    VerifyExtractedDataParams 
} from 'common/interfaces/document-process.interface';
import DocumentProcessService from 'services/document-process.service';
import AsyncMiddleware from 'util/async-handler';
import Success from 'server/responses/success-response/success';
import BadRequest from 'server/responses/client-errors/bad-request';

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
        async (req: Request, res: Response) => {
            const file = req.file as Express.Multer.File;
            const { type, applicationId } = req.body;
            const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;
            const userId = req?.userId;
            
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');
            if (!type) throw new BadRequest('Invalid_document_type', 'Document type is required', 'Document type is required');
            if (!applicationId) throw new BadRequest('Invalid_application_id', 'Application ID is required', 'Application ID is required');

            const result = await this.documentProcessService.uploadAndProcessDocument(file, type, applicationId, userId, metadata);
            const response = new Success(result).toJson;
            return res.status(201).json(response);
        }
    );

    /**
     * Get all documents for a specific application
     * @param req Express request object
     * @param res Express response object
     */
    getApplicationDocuments = AsyncMiddleware.asyncHandler(
        async (req: Request<GetApplicationDocumentsParams>, res: Response) => {
            const { applicationId } = req.params;
            const userId = req?.userId;
            
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.documentProcessService.getApplicationDocuments(applicationId, userId);
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get extracted data for a specific document
     * @param req Express request object
     * @param res Express response object
     */
    getExtractedData = AsyncMiddleware.asyncHandler(
        async (req: Request<GetDocumentByIdParams>, res: Response) => {
            const { documentId } = req.params;
            const userId = req?.userId;
            
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.documentProcessService.getExtractedData(documentId, userId);
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Verify extracted data
     * @param req Express request object
     * @param res Express response object
     */
    verifyExtractedData = AsyncMiddleware.asyncHandler(
        async (req: Request<VerifyExtractedDataParams>, res: Response) => {
            const { extractedDataId } = req.params;
            const { isVerified } = req.body;
            const userId = req?.userId;
            
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');
            if (isVerified === undefined) throw new BadRequest('Invalid_verification', 'Verification status is required', 'Verification status is required');

            const result = await this.documentProcessService.verifyExtractedData(extractedDataId, isVerified, userId);
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );
}