export interface DraftFormData {
  studentInfo: {
    fullName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female';
    educationDepartment?: string;
    primarySchool?: string;
    grade?: string;
    placeOfBirth?: string;
    ethnicity?: string;
  };

  parentInfo: {
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
  };

  residenceInfo: {
    permanentAddress?: string;
    temporaryAddress?: string;
    currentAddress?: string;
  };

  commitment?: {
    relationship?: string;
    signatureDate?: Date;
    guardianName?: string;
    applicantName?: string;
  };

  competitionResults?: {
    competitionId: string;
    level: string;
    year: number;
    achievement: string;
  }[];
}