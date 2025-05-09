
export enum DocumentProcessStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    USER_CANCELLED = 'user_cancelled',
    USER_NOT_FOUND = 'user_not_found',
    DOCUMENT_NOT_FOUND = 'document_not_found',
    DOCUMENT_NOT_UPLOADED = 'document_not_uploaded',
    DOCUMENT_UPLOAD_FAILED = 'document_upload_failed',
    DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
}

export enum ApplicationFailedReason {
    DOCUMENT_NOT_FOUND = 'document_not_found',
    DOCUMENT_NOT_UPLOADED = 'document_not_uploaded',
    DOCUMENT_UPLOAD_FAILED = 'document_upload_failed',
    DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
    DOCUMENT_PROCESSING_FAILED_INVALID_DATA = 'document_processing_failed_invalid_data',
    DOCUMENT_PROCESSING_FAILED_INVALID_FORMAT = 'document_processing_failed_invalid_format',
    DOCUMENT_PROCESSING_FAILED_INVALID_FILE_TYPE = 'document_processing_failed_invalid_file_type',
    DOCUMENT_QUALITY_CHECK_FAILED = 'document_quality_check_failed',
    DOCUMENT_INFORMATION_MISSING = 'document_information_missing',
}

export const ApplicationFailedReasonMessage = {
    DOCUMENT_NOT_FOUND: 'Không tìm thấy tài liệu',
   DOCUMENT_NOT_UPLOADED: 'Tài liệu không được tải lên',
   DOCUMENT_UPLOAD_FAILED: 'Tải lên tài liệu thất bại',
   DOCUMENT_PROCESSING_FAILED: 'Xử lý tài liệu thất bại',
   DOCUMENT_PROCESSING_FAILED_INVALID_DATA: 'Dữ liệu tài liệu không hợp lệ',
   DOCUMENT_PROCESSING_FAILED_INVALID_FORMAT: 'Định dạng tài liệu không hợp lệ',
   DOCUMENT_PROCESSING_FAILED_INVALID_FILE_TYPE: 'Định dạng tài liệu không hợp lệ',
   DOCUMENT_QUALITY_CHECK_FAILED: 'Kiểm tra chất lượng tài liệu thất bại',
   DOCUMENT_INFORMATION_MISSING: 'Thông tin tài liệu không đầy đủ',
} as const;

export enum ValidationStatus {
    VALID = 'valid',
    INVALID = 'invalid',
    PARTIAL_VALID = 'partial_valid',
}

export enum DocumentType {
    TRANSCRIPT = 'transcript',
    CERTIFICATE = 'certificate',
}



