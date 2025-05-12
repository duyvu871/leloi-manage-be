export enum StudentStatus {
    ELIGIBLE = 'eligible',
    INELIGIBLE = 'ineligible',
    PENDING = 'pending',
    CONFIRMED = 'confirmed'
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female'
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
    [StudentStatus.ELIGIBLE]: 'Đủ điều kiện',
    [StudentStatus.INELIGIBLE]: 'Không đủ điều kiện',
    [StudentStatus.PENDING]: 'Đang xử lý',
    [StudentStatus.CONFIRMED]: 'Đã xác nhận'
}; 