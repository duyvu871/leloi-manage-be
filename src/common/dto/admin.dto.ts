import { StudentStatus, Gender } from '../enums/admin.enum';
import { StudentDto, ParentInfoDto, ApplicationDto, GradeDto, DocumentDto } from './registration.dto';

export interface StudentListItemDto {
    id: number;
    studentId: string;
    name: string;
    dob: Date;
    gender: Gender;
    currentSchool: string;
    status: StudentStatus;
    statusReason?: string;
    lastUpdated: Date;
}

export interface AdminDashboardStatsDto {
    totalApplications: number;
    eligibleCount: number;
    ineligibleCount: number;
    pendingCount: number;
    confirmedCount: number;
}

export interface StudentFilterDto {
    search?: string;
    status?: StudentStatus;
    gender?: Gender;
    school?: string;
    page?: number;
    limit?: number;
}

export interface ExamInfo {
    sbd?: string;
    room?: string;
    date?: string;
    time?: string;
}

export interface StudentDetailDto {
    student: StudentDto;
    parent: ParentInfoDto;
    application: ApplicationDto | null;
    transcriptData: {
        subjects: Array<{
            name: string;
            score: number;
            evaluation?: string;
        }>;
        behavior?: string;
        attendanceRate?: string;
        teacherComments?: string;
    };
    status: {
        currentStatus: StudentStatus;
        reason?: string;
        lastUpdated: Date;
        examInfo?: ExamInfo;
    };
    certificates: string[];
    academicRecords: {
        grades: GradeDto[];
    }
}

export interface UpdateStudentStatusDto {
    status: StudentStatus;
    reason?: string;
    examInfo?: ExamInfo;
}

export interface PaginatedResponseDto<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PendingReviewStudentDto {
    id: number;
    studentId: string;
    name: string;
    reason: string;
    lastUpdated: Date;
}

export interface DetailedStatsDto {
    totalApplications: number;
    eligibleCount: number;
    ineligibleCount: number;
    processingCount: number;
    confirmedCount: number;
}

export interface UpdateStudentInfoDto {
    fullName?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    educationDepartment?: string;
    primarySchool?: string;
    grade?: string;
    placeOfBirth?: string;
    ethnicity?: string;
    permanentAddress?: string;
    temporaryAddress?: string;
    currentAddress?: string;
    examNumber?: string;
    examRoom?: string;
    studentCode?: string;
    identificationNumber?: string;
}

export interface StudentDocumentDto {
    id: number;
    documentId: number;
    applicationId: number;
    document: DocumentDto;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    isEligible: boolean;
    rejectionReason?: string;
    verificationDate?: Date;
    createdAt: Date;
    updatedAt: Date;
} 