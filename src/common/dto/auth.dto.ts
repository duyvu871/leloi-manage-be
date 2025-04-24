/**
 * DTO interfaces for authentication
 */

/**
 * Data transfer object for user registration
 */
export interface RegisterDto {
	/** User's email address */
	email: string;

	/** User's password */
	password: string;

	/** User's full name */
	fullName: string;

	/** User's phone number */
	phone: string;

	/** User's address */
	address: string;

	/** Relationship with student (for parent role) */
	relationship?: "father" | "mother" | "guardian" | null;
}

/**
 * Data transfer object for user login
 */
export interface LoginDto {
	/** Username for login */
	username: string;

	/** User's password */
	password: string;
}

/**
 * Interface for parent information
 */
export interface ParentInfoDto {
	// Father information
	fatherName: string | null;
	fatherBirthYear: number | null;
	fatherPhone: string | null;
	fatherIdCard: string | null;
	fatherOccupation: string | null;
	fatherWorkplace: string | null;

	// Mother information
	motherName: string | null;
	motherBirthYear: number | null;
	motherPhone: string | null;
	motherIdCard: string | null;
	motherOccupation: string | null;
	motherWorkplace: string | null;

	// Guardian information (if not father/mother)
	guardianName: string | null;
	guardianBirthYear: number | null;
	guardianPhone: string | null;
	guardianIdCard: string | null;
	guardianOccupation: string | null;
	guardianWorkplace: string | null;
	guardianRelationship: string | null;
}

/**
 * Interface for application information
 */
export interface ApplicationDto {
    id: number;
    status: string;
    isEligible: boolean;
    rejectionReason?: string | null;
    verificationDate?: Date | null;
}

export interface StudentInfoDto {
    /** Student's ID */
    id: number;
    
    /** Student's full name */
    fullName: string;
    
    /** Student's date of birth */
    dateOfBirth: Date;
    
    /** Student's gender */
    gender: string;
    
    /** Education department */
    educationDepartment: string;
    
    /** Primary school */
    primarySchool: string;
    
    /** Grade level */
    grade: string;
    
    /** Place of birth */
    placeOfBirth: string;
    
    /** Ethnicity */
    ethnicity: string;
    
    /** Permanent address */
    permanentAddress: string;
    
    /** Temporary address */
    temporaryAddress?: string | null;
    
    /** Current address */
    currentAddress: string;
    
    /** Exam number */
    examNumber?: string | null;
    
    /** Exam room */
    examRoom?: string | null;
    
    /** Student code */
    studentCode?: string | null;
    
    /** Identification number */
    identificationNumber?: string | null;
    
    /** Grade information */
    grades?: Array<{
        id: number;
        subjectId: number;
        score: number;
        examDate: Date;
        subject?: {
            id: number;
            name: string;
            description?: string;
        };
    }> | null;
    
    /** Priority points information */
    priorityPoint?: {
        type: string;
        points: number;
    } | null;
    
    /** Bonus points information */
    bonusPoints?: Array<{
        category: string;
        level: string;
        achievement: string;
        points: number;
    }> | null;
    
    /** Commitment information */
    commitment?: {
        relationship: string;
        signatureDate: Date;
        guardianName: string;
        applicantName: string;
    } | null;

	application?: ApplicationDto | null;
}

export interface ProfileResponse {
	/** User's ID */
	id: string;

	/** User's email address */
	email: string;

	/** User's full name */
	fullName: string;

	/** User's phone number */
	phone: string;

	/** User's address */
	address: string;

	/** User's relationship with student (for user role) */
	relationship?: "father" | "mother" | "guardian" | null;

	/** User's role (e.g., "user", "admin") */
	role: 'user' | 'admin';
	
	/** User's profile information */
	students: StudentInfoDto[];

	/** User's parent information */
	parentInfo: ParentInfoDto | null;
}