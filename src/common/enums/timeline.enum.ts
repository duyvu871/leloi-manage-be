export enum TimelineType {
    REGISTRATION = 'registration',
    DOCUMENT = 'document',
    EXAM = 'exam',
    RESULT = 'result',
    ENROLLMENT = 'enrollment'
}

export const TIMELINE_TYPE_LABELS: Record<TimelineType, string> = {
    [TimelineType.REGISTRATION]: 'Nộp hồ sơ',
    [TimelineType.DOCUMENT]: 'Nộp giấy tờ',
    [TimelineType.EXAM]: 'Lịch thi',
    [TimelineType.RESULT]: 'Kết quả',
    [TimelineType.ENROLLMENT]: 'Nhập học'
}; 