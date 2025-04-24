/**
 * Interface for document upload parameters
 */
export interface DocumentUploadParams {
    applicationId: string;
}

/**
 * Interface for get document by ID parameters
 */
export type GetDocumentByIdParams = {
    documentId: string;
}

/**
 * Interface for get application documents parameters
 */
export type GetApplicationDocumentsParams = {
    applicationId: string;
}

/**
 * Interface for verify extracted data parameters
 */
export type VerifyExtractedDataParams = {
    extractedDataId: string;
}

/**
 * Interface for document processing job
 */
export interface DocumentProcessJob {
    id: string;
    userId: string | number;
    fileId: string;
    fileName: string;
    fileUrl: string;
    type: 'transcript' | 'certificate' | 'identity' | string;
    applicationId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: Record<string, unknown>;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}