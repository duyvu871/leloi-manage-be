/**
 * Interface for student data transfer object
 */
export interface StudentDto {
    fullName: string;
    dateOfBirth: string | Date;
    gender: string;
    educationDepartment: string;
    primarySchool: string;
    grade: string;
    placeOfBirth: string;
    ethnicity: string;
    permanentAddress: string;
    currentAddress: string;
    temporaryAddress?: string;
    examNumber?: string;
    examRoom?: string;
    studentCode?: string;
    identificationNumber?: string;
}

/**
 * Interface for application data transfer object
 */
export interface ApplicationDto {
    studentId: number;
}

/**
 * Interface for document upload data
 */
export interface DocumentUploadDto {
    applicationId: number;
    type: 'TRANSCRIPT' | 'CERTIFICATE' | 'OTHER';
}

/**
 * Interface for schedule booking data
 */
export interface BookScheduleDto {
    applicationId: number;
    scheduleSlotId: number;
}

/**
 * Interface for student response data
 */
export interface StudentResponse {
    id: number;
    parentId: number;
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    schoolOrigin: string;
    examNumber?: string;
    examRoom?: string;
    createdAt: Date;
    updatedAt: Date;
    application?: ApplicationResponse;
}

/**
 * Interface for application response data
 */
export interface ApplicationResponse {
    id: number;
    studentId: number;
    status: string;
    isEligible: boolean;
    rejectionReason?: string;
    verificationDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    student: StudentResponse;
    documents: DocumentResponse[];
    scheduleSlot?: ScheduleSlotResponse;
}

/**
 * Interface for document response data
 */
export interface DocumentResponse {
    id: number;
    applicationId: number;
    type: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
}

/**
 * Interface for schedule response data
 */
export interface ScheduleResponse {
    id: number;
    managerId: number;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    slots: ScheduleSlotResponse[];
}

/**
 * Interface for schedule slot response data
 */
export interface ScheduleSlotResponse {
    id: number;
    scheduleId: number;
    applicationId?: number;
    startTime: Date;
    endTime: Date;
    capacity: number;
    isFilled: boolean;
}