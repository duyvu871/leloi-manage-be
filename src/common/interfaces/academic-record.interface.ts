import { AcademicRecord } from "@prisma/client";
import { PrismaPaginationOptions } from "server/shared/helpers/pagination-parse";

export interface SubjectGrade {
  id?: number;
  grade: number;
  subjectCode: string;
  score: number;
}

export interface AcademicRecordCreate {
  studentId: number;
  grades: SubjectGrade[];
  semester?: number;
  schoolYear?: string;
  source?: string; // Nguồn dữ liệu (ví dụ: 'TRANSCRIPT', 'MANUAL_INPUT', etc.)
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: Date;
  verifiedBy?: number; // ID của người xác minh
  notes?: string;
}

export interface AcademicRecordFilter {
  studentId?: number;
  grade?: number;
  subjectCode?: string;
  schoolYear?: string;
  semester?: number;
  verificationStatus?: string;
}

export interface AcademicRecordRepositoryInterface {
  /**
   * Create a new academic record
   */
  create(data: AcademicRecordCreate): Promise<AcademicRecord>;

  /**
   * Update an existing academic record
   */
  update(id: number, data: Partial<AcademicRecordCreate>): Promise<AcademicRecord>;

  /**
   * Delete an academic record
   */
  delete(id: number): Promise<void>;

  /**
   * Find academic record by ID
   */
  findById(id: number): Promise<AcademicRecord | null>;

  /**
   * Find all academic records by student ID
   */
  findByStudentId(studentId: number): Promise<AcademicRecord[]>;

  /**
   * Find academic records with filters
   */
  findByFilter(filter: PrismaPaginationOptions<'academicRecord'>): Promise<AcademicRecord[]>;

  /**
   * Get average score by subject for a student
   */
  getAverageScoreBySubject(studentId: number, subjectCode: string): Promise<number>;

  /**
   * Get all grades for a student in a specific subject
   */
  getSubjectGrades(studentId: number, subjectCode: string): Promise<SubjectGrade[]>;

  /**
   * Verify academic record
   */
  verifyRecord(id: number, verifierId: number, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<AcademicRecord>;

  /**
   * Get academic summary for a student
   */
  getAcademicSummary(studentId: number): Promise<{
    overallAverage: number;
    subjectAverages: { subjectCode: string; average: number }[];
    totalRecords: number;
    verifiedRecords: number;
  }>;
} 