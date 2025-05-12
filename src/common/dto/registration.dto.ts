// Student related types
export interface StudentDto {
    id: number;
    userId: number;
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    educationDepartment: string;
    primarySchool: string;
    grade: string;
    placeOfBirth: string;
    ethnicity: string;
    permanentAddress: string;
    temporaryAddress?: string;
    currentAddress: string;
    examNumber?: string;
    examRoom?: string;
    studentCode?: string;
    identificationNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Application related types
export interface ApplicationDto {
    id: number;
    studentId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Parent information related types
export interface ParentInfoDto {
    id: number;
    userId: number;
    fatherName?: string;
    fatherBirthYear?: number;
    fatherPhone?: string;
    fatherIdCard?: string;
    fatherOccupation?: string;
    fatherWorkplace?: string;
    motherName?: string;
    motherBirthYear?: number;
    motherPhone?: string;
    motherIdCard?: string;
    motherOccupation?: string;
    motherWorkplace?: string;
    guardianName?: string;
    guardianBirthYear?: number;
    guardianPhone?: string;
    guardianIdCard?: string;
    guardianOccupation?: string;
    guardianWorkplace?: string;
    guardianRelationship?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Priority points related types
export interface PriorityPointDto {
    id: number;
    studentId: number;
    type: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

// Competition results related types
export interface CompetitionResultDto {
    competitionId: string;
    level: string;
    achievement: string;
    points: number;
    year: number;
}

// Commitment related types
export interface CommitmentDto {
    id: number;
    studentId: number;
    relationship: string;
    signatureDate: Date;
    guardianName: string;
    applicantName: string;
    createdAt: Date;
    updatedAt: Date;
}

// Academic records related types
export interface GradeDto {
    grade: number;
    math: number;
    vietnamese: number;
    english?: number;
    science?: number;
    history?: number;
}

export interface AcademicRecordsDto {
    academicRecords: {
        grades: GradeDto[];
    };
}

// Registration response DTO that combines all related entities
export interface RegistrationResponseDto {
    student: StudentDto;
    application: ApplicationDto | null;
    parentInfo: ParentInfoDto;
    priorityPoint?: PriorityPointDto;
    competitionResults?: CompetitionResultDto[];
    commitment?: CommitmentDto;
    academicRecords?: AcademicRecordsDto;
}

// Document related types
export interface DocumentDto {
    id: number;
    name: string;
    description?: string;
    url: string;
    type: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
}

// Competition related types
export type AchievementLevel = 'none' | 'first' | 'second' | 'third';
export type CompetitionLevel = 'city' | 'national';

export interface CompetitionDto {
    id: string;
    name: string;
    description?: string;
    category: CompetitionCategory;
    levels: CompetitionLevel[];
    isActive: boolean;
    order: number;
}

export type CompetitionCategory = 
    | 'academic'      // Học thuật
    | 'sports'        // Thể thao
    | 'arts'          // Nghệ thuật
    | 'literature'    // Văn học
    | 'science'       // Khoa học
    | 'technology'    // Công nghệ
    | 'other';        // Khác
