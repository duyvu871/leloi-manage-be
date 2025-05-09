import { z } from "zod";
import { FileType } from "server/common/enums/file-types.enum";

export class DocumentProcessValidation {
    public static documentUpload = z.object({
        file: z.any(), // File validation is handled by middleware
        type: z.enum(['transcript', 'certificate'] as const, {
            required_error: "Document type is required",
            invalid_type_error: "Invalid document type"
        }),
        applicationId: z.string({
            required_error: "Application ID is required",
            invalid_type_error: "Application ID must be a string"
        }).min(1, "Application ID cannot be empty"),
        metadata: z.record(z.any()).optional()
    });

    public static applicationId = z.object({
        applicationId: z.string({
            required_error: "Application ID is required",
            invalid_type_error: "Application ID must be a string"
        }).min(1, "Application ID cannot be empty")
    });

    public static documentId = z.object({
        documentId: z.string({
            required_error: "Document ID is required",
            invalid_type_error: "Document ID must be a string"
        }).min(1, "Document ID cannot be empty")
    });

    public static extractedDataId = z.object({
        extractedDataId: z.string({
            required_error: "Extracted Data ID is required",
            invalid_type_error: "Extracted Data ID must be a string"
        }).min(1, "Extracted Data ID cannot be empty")
    });

    public static verifyExtractedData = z.object({
        isVerified: z.boolean({
            required_error: "Verification status is required",
            invalid_type_error: "Verification status must be a boolean"
        }),
        verificationNotes: z.string().optional()
    });
}

// Type definitions from zod schemas
export type DocumentUploadRequest = z.infer<typeof DocumentProcessValidation.documentUpload>;
export type ApplicationIdParam = z.infer<typeof DocumentProcessValidation.applicationId>;
export type DocumentIdParam = z.infer<typeof DocumentProcessValidation.documentId>;
export type ExtractedDataIdParam = z.infer<typeof DocumentProcessValidation.extractedDataId>;
export type VerifyExtractedDataRequest = z.infer<typeof DocumentProcessValidation.verifyExtractedData>; 