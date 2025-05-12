export interface Student {
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

export interface Application {
    id: number;
    studentId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ParentInfo {
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

export interface PriorityPoint {
    id: number;
    studentId: number;
    type: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CompetitionResult {
    competitionId: string;
    level: string;
    achievement: string;
    points: number;
    year: number;
}

export interface Commitment {
    id: number;
    studentId: number;
    relationship: string;
    signatureDate: Date;
    guardianName: string;
    applicantName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Grade {
    grade: number;
    math: number;
    vietnamese: number;
    english?: number;
    science?: number;
    history?: number;
}

export interface AcademicRecords {
    academicRecords: {
        grades: Grade[];
    };
}

export interface RegistrationData {
    student: Student;
    application: Application | null;
    parentInfo: ParentInfo;
    priorityPoint?: PriorityPoint;
    competitionResults?: CompetitionResult[];
    commitment?: Commitment;
    academicRecords?: AcademicRecords;
}

// Request types
export interface StudentIdParam {
    studentId: string;
}

// Response types
export interface RegistrationResponse {
    success: boolean;
    message: string;
    data: RegistrationData;
}