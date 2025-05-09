
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


export interface CertificateProcessResult {
    name: string;
    extracted_name: string;
    level: string;
    correct: boolean;
}

export interface TranscriptData {
    ten: string;
    monHoc: Array<{
        mon: string;
        muc: string;
        diem: number | null;
    }>;
    phamChat?: Record<string, string>;
    nangLuc?: Record<string, string>;
}

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

/**
 * Interface for document processing job
 */
export interface DocumentProcessJob<T> {
    id: string;
    userId: number;
    fileId: number;
    fileName: string;
    fileUrl: string;
    path: string;
    applicationDocumentId: number;
    type: 'transcript' | 'certificate';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;//Record<string, TranscriptData> | CertificateProcessResult;
    error?: string;
    createdAt: Date; 
    updatedAt: Date;
}
