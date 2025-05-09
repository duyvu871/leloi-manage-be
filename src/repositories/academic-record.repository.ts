import { AcademicRecord, PrismaClient } from '@prisma/client';
import { AcademicRecordCreate, AcademicRecordRepositoryInterface, SubjectGrade } from 'server/common/interfaces/academic-record.interface';
import { PrismaPaginationOptions } from 'server/shared/helpers/pagination-parse';
import logger from 'util/logger';

export class AcademicRecordRepository implements AcademicRecordRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: AcademicRecordCreate): Promise<AcademicRecord> {
    try {
      const { grades, ...recordData } = data;
      
      return await this.prisma.academicRecord.create({
        data: {
          ...recordData,
          grades: {
            create: grades.map(grade => ({
              grade: grade.grade,
              score: grade.score,
              subject: {
                connect: {
                  code: grade.subjectCode
                }
              }
            }))
          }
        },
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.create:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<AcademicRecordCreate>): Promise<AcademicRecord> {
    try {
      const { grades, ...recordData } = data;
      
      if (grades) {

        // // Create new grades
        // await this.prisma.subjectGrade.createMany({
        //   data: grades.map(grade => ({
        //     academicRecordId: id,
        //     grade: grade.grade,
        //     score: grade.score,
        //     subject: {
        //         connect: {
        //             code: grade.subjectCode
        //         }
        //     } 
        //   }))
        // });
      //   await this.prisma.$transaction(async (tx) => {
      //     await Promise.all(grades.map(async (grade) => {
      //       const  { id , ...rest } = grade;
      //       await tx.subjectGrade.upsert({
      //         where: { id },
      //         update: rest,
      //         create: {
      //           ...rest,
      //           academicRecordId: id
      //         }
      //       });
      //     }));
      //   });
      }

      return await this.prisma.academicRecord.update({
        where: { id },
        data: recordData,
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.prisma.academicRecord.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.delete:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<AcademicRecord | null> {
    try {
      return await this.prisma.academicRecord.findUnique({
        where: { id },
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.findById:', error);
      throw error;
    }
  }

  async findByStudentId(studentId: number): Promise<AcademicRecord[]> {
    try {
      return await this.prisma.academicRecord.findMany({
        where: { studentId },
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        },
        orderBy: [
          { schoolYear: 'desc' },
          { semester: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.findByStudentId:', error);
      throw error;
    }
  }

  async findByFilter(filter: PrismaPaginationOptions<'academicRecord'>, subjectCode?: string): Promise<AcademicRecord[]> {
    try {
      const { ...otherFilters } = filter;
      
      return await this.prisma.academicRecord.findMany({
        where: {
          ...otherFilters,
          grades: subjectCode ? {
            some: {
              subject: {
                code: subjectCode
              }
            }
          } : undefined
        },
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        },
        orderBy: [
          { schoolYear: 'desc' },
          { semester: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.findByFilter:', error);
      throw error;
    }
  }

  async getAverageScoreBySubject(studentId: number, subjectCode: string): Promise<number> {
    try {
      const grades = await this.prisma.subjectGrade.findMany({
        where: {
          academicRecord: {
            studentId
          },
          subject: {
            code: subjectCode
          }
        },
        select: {
          score: true
        }
      });

      if (grades.length === 0) return 0;

      const sum = grades.reduce((acc, grade) => acc + grade.score, 0);
      return sum / grades.length;
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.getAverageScoreBySubject:', error);
      throw error;
    }
  }

  async getSubjectGrades(studentId: number, subjectCode: string): Promise<SubjectGrade[]> {
    try {
      const grades = await this.prisma.subjectGrade.findMany({
        where: {
          academicRecord: {
            studentId
          },
          subject: {
            code: subjectCode
          }
        },
        include: {
          subject: true,
          academicRecord: true
        },
        orderBy: [
          { academicRecord: { schoolYear: 'desc' } },
          { academicRecord: { semester: 'desc' } }
        ]
      });

      return grades.map(grade => ({
        grade: grade.grade,
        subjectCode: grade.subject.code,
        score: grade.score
      }));
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.getSubjectGrades:', error);
      throw error;
    }
  }

  async verifyRecord(
    id: number,
    verifierId: number,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<AcademicRecord> {
    try {
      return await this.prisma.academicRecord.update({
        where: { id },
        data: {
          verificationStatus: status,
          verifiedBy: verifierId,
          verifiedAt: new Date(),
          notes: notes
        },
        include: {
          grades: {
            include: {
              subject: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.verifyRecord:', error);
      throw error;
    }
  }

  async getAcademicSummary(studentId: number): Promise<{
    overallAverage: number;
    subjectAverages: { subjectCode: string; average: number }[];
    totalRecords: number;
    verifiedRecords: number;
  }> {
    try {
      // Get all grades for the student
      const grades = await this.prisma.subjectGrade.findMany({
        where: {
          academicRecord: {
            studentId
          }
        },
        include: {
          subject: true,
          academicRecord: true
        }
      });

      // Calculate overall average
      const overallAverage = grades.length > 0
        ? grades.reduce((acc, grade) => acc + grade.score, 0) / grades.length
        : 0;

      // Calculate subject averages
      const subjectScores: { [key: string]: number[] } = {};
      grades.forEach(grade => {
        if (!subjectScores[grade.subject.code]) {
          subjectScores[grade.subject.code] = [];
        }
        subjectScores[grade.subject.code].push(grade.score);
      });

      const subjectAverages = Object.entries(subjectScores).map(([code, scores]) => ({
        subjectCode: code,
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }));

      // Get record counts - Fixed version
      const [totalRecords, verifiedRecords] = await Promise.all([
        this.prisma.academicRecord.count({
          where: { studentId }
        }),
        this.prisma.academicRecord.count({
          where: {
            studentId,
            verificationStatus: 'VERIFIED'
          }
        })
      ]);

      return {
        overallAverage,
        subjectAverages,
        totalRecords,
        verifiedRecords
      };
    } catch (error) {
      logger.error('Error in AcademicRecordRepository.getAcademicSummary:', error);
      throw error;
    }
  }
} 