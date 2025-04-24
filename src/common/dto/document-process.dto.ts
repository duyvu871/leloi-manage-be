import { AssetMetadata } from '../interfaces/asset-upload.interface';

/**
 * DTO for document upload request
 */
export interface DocumentUploadRequestDto {
    file: Express.Multer.File;
    type: string;
    applicationId: string;
    metadata?: Record<string, unknown>;
}

/**
 * DTO for document response
 */
export interface DocumentResponseDto {
    id: string | number;
    type: string;
    filename: string;
    url: string;
    uploadedAt: string | Date;
}

/**
 * DTO for extracted data response
 */
export interface ExtractedDataResponseDto {
    id: string | number;
    fields: Record<string, unknown>;
    isVerified: boolean;
}

/**
 * DTO for document upload response
 */
export interface DocumentUploadResponseDto {
    document: DocumentResponseDto;
    extractedData: ExtractedDataResponseDto;
}

/**
 * DTO for application documents response
 */
export interface ApplicationDocumentsResponseDto {
    documents: DocumentResponseDto[];
}

/**
 * DTO for extracted data verification request
 */
export interface VerifyExtractedDataRequestDto {
    isVerified: boolean;
}

/**
 * DTO for transcript process result
 */
export interface TranscriptProcessResultDto {
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
 * DTO for certificate process result
 */
export interface CertificateProcessResultDto {
    name: string;
    extracted_name: string;
    level: string;
    correct: boolean;
}