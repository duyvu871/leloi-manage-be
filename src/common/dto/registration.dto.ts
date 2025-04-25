// Registration response DTO that combines all related entities
export interface RegistrationResponseDto {
    student: Student;
    application: Application | null;
    parentInfo: ParentInfo;
    priorityPoint?: PriorityPoint;
    competitionResults?: CompetitionResult[];
    commitment?: Commitment;
    grades?: Grade[];
}


// Student related types
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
    temporaryAddress?: string | null;
    currentAddress: string;
    examNumber?: string | null;
    examRoom?: string | null;
    studentCode?: string | null;
    identificationNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Application related types
export interface Application {
    id: number;
    studentId: number;
    // status: ApplicationStatus;
    // isEligible: boolean;
    // rejectionReason?: string | null;
    // verificationDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type ApplicationStatus = string;

// Document related types
export interface Document {
    id: number;
    applicationId: number;
    fileName: string;
    fileUrl: string;
    type: DocumentType;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
}

export type DocumentType = 'transcript' | 'certificate' | 'other';

// Extracted data type
export interface ExtractedData {
    id: number;
    documentId: number;
    data: any; // JSON data
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Grades related types
export interface Grade {
    id: number;
    studentId: number;
    subjectId: number;
    score: number;
    examDate: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Relation
    subject?: Subject;
}

export interface Subject {
    id: number;
    name: string;
    description?: string | null;
}

// Bonus points related types
export interface BonusPoint {
    id: number;
    studentId: number;
    category: string; 
    level: string;
    achievement: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

// Priority points related types
export interface PriorityPoint {
    id: number;
    studentId: number;
    type: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

export type PriorityType = string; // Updated to allow any string value


// Commitment related types
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

// Parent information related types
export interface ParentInfo {
    id: number;
    userId: number;
    
    // Father information
    fatherName?: string | null;
    fatherBirthYear?: number | null;
    fatherPhone?: string | null;
    fatherIdCard?: string | null;
    fatherOccupation?: string | null;
    fatherWorkplace?: string | null;
    
    // Mother information
    motherName?: string | null;
    motherBirthYear?: number | null;
    motherPhone?: string | null;
    motherIdCard?: string | null;
    motherOccupation?: string | null;
    motherWorkplace?: string | null;
    
    // Guardian information
    guardianName?: string | null;
    guardianBirthYear?: number | null;
    guardianPhone?: string | null;
    guardianIdCard?: string | null;
    guardianOccupation?: string | null;
    guardianWorkplace?: string | null;
    guardianRelationship?: string | null;
    
    createdAt: Date;
    updatedAt: Date;
}

export type AchievementLevel = 'none' | 'first' | 'second' | 'third';
export type CompetitionLevel = 'city' | 'national';

export interface Competition {
    id: string;
    name: string;
    description?: string;
    category: CompetitionCategory;
    levels: CompetitionLevel[];
    isActive: boolean;
    order: number;
}

export interface CompetitionResult {
    competitionId: string;
    level: string;
    achievement: string;
    points: number;
    year: number;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verificationDate?: Date;
    verifiedBy?: string;
}


export type CompetitionCategory = 
    | 'academic'      // Học thuật
    | 'sports'        // Thể thao
    | 'arts'          // Nghệ thuật
    | 'literature'    // Văn học
    | 'science'       // Khoa học
    | 'technology'    // Công nghệ
    | 'other';        // Khác
