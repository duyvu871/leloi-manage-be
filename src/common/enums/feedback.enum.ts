export enum FeedbackType {
    ERROR = 'error',
    SUGGESTION = 'suggestion',
    OTHER = 'other'
}

export enum FeedbackStatus {
    PENDING = 'pending',
    RESOLVED = 'resolved'
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
    [FeedbackType.ERROR]: 'Lỗi',
    [FeedbackType.SUGGESTION]: 'Góp ý',
    [FeedbackType.OTHER]: 'Khác'
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
    [FeedbackStatus.PENDING]: 'Đang chờ xử lý',
    [FeedbackStatus.RESOLVED]: 'Đã xử lý'
}; 