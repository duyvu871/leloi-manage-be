import { Prisma, PrismaClient } from '@prisma/client';
// import { DraftFormData } from 'server/common/interfaces/registration.interface';
import prisma from 'repository/prisma';
import { Transaction } from 'server/@types/prisma';
import e from 'express';
import { GradeDto, RegistrationResponseDto } from 'server/common/dto/registration.dto';
import Forbidden from 'server/responses/client-errors/forbidden';
import { RegistrationApiData } from 'validations/registration.validation';
import DatabaseSeeder from 'server/loaders/database-seeder.loader';

export class RegistrationService {
    async saveRegistrationDraft(userId: number, draftData: RegistrationApiData) {
        return await prisma.$transaction(async (tx) => {
            // 1. Save student information
            const student = await this.saveStudentInfo(tx, userId, draftData);

            // 2. Save parent information
            await this.saveParentInfo(tx, userId, draftData);

            // 3. Save academic record if provided
            if (draftData.academicRecords && draftData.academicRecords.grades.length > 0) {
                await this.saveAcademicRecord(tx, student.id, draftData.academicRecords);
            }

            // 4. Save commitment if provided
            if (draftData.commitment) {
                await this.saveCommitment(tx, student.id, draftData.commitment);
            }

            // 4. Save competition results if provided
            if (draftData.competitionResults && draftData.competitionResults.length > 0) {
                await this.saveCompetitionResults(tx, student.id, draftData.competitionResults);
            }

            

            // // 5. Create an application record
            // const application = await tx.application.create({
            //     data: {
            //         studentId: student.id,
            //         status: 'pending',
            //         isEligible: false,
            //         type: 'transcript'
            //     }
            // });

            return {
                studentId: student.id,
                // applicationId: application.id
            };
        }, {
            timeout: 10000,
            maxWait: 10000,
            // isolationLevel: 'read committed' //
        });
    }

    private async saveAcademicRecord(tx: Transaction, studentId: number, academicRecords: NonNullable<RegistrationApiData['academicRecords']>) {
        const { grades } = academicRecords;

        // Check if academic record already exists
        const existingAcademicRecord = await tx.academicRecord.findFirst({
            where: { studentId }
        });

        const allSubjects = await tx.subject.findMany();

        console.log('allSubjects', allSubjects);
        

        if (existingAcademicRecord) {

            const newScores = existingAcademicRecord.scores;

            console.log('newScores', newScores);
            
            // Update existing academic record
            const updateAcademicRecord = await tx.academicRecord.update({
                where: {
                    id: existingAcademicRecord.id
                },
                data: {
                    semester: 0,
                    schoolYear: '',
                    source: 'manual',
                    verificationStatus: 'pending',
                    scores: academicRecords.grades,
                    verifiedAt: null,
                    verifiedBy: null,
                    notes: null
                }
            });

            // // Lấy danh sách subject grades hiện tại
            // const existingSubjectGrades = await tx.subjectGrade.findMany({
            //     where: {
            //         academicRecordId: existingAcademicRecord.id
            //     },
            //     select: {
            //         id: true,
            //         subjectId: true,
            //         grade: true
            //     }
            // });

            // const flatSubjects = academicRecords.grades.map(grade => ({
            //     grade: grade.grade,
            //     subjects: Object.entries(grade).filter(([key]) => key !== 'grade')
            // }));

            // const updateOperations: Promise<any>[] = [];

            // for (const subject of flatSubjects) {
            //     for (const [subjectSlug, score] of subject.subjects) {
            //         const subjectId = allSubjects.find(s => s.name === subjectSlug)?.id;
            //         if (!subjectId) continue;

            //         // Tìm subject grade hiện tại nếu có
            //         const existingGrade = existingSubjectGrades.find(
            //             sg => sg.subjectId === subjectId && sg.grade === subject.grade
            //         );

            //         if (existingGrade) {
            //             // Update nếu đã tồn tại
            //             updateOperations.push(
            //                 tx.subjectGrade.update({
            //                     where: { id: existingGrade.id },
            //                     data: { score }
            //                 })
            //             );
            //         } else {
            //             // Create mới nếu chưa tồn tại
            //             updateOperations.push(
            //                 tx.subjectGrade.create({
            //                     data: {
            //                         academicRecordId: updateAcademicRecord.id,
            //                         subjectId,
            //                         grade: subject.grade,
            //                         score
            //                     }
            //                 })
            //             );
            //         }
            //     }
            // }

            // // Thực hiện tất cả các operations
            // await Promise.all(updateOperations);
        } else {
            // create new academic record
            const newAcademicRecord = await tx.academicRecord.create({
                data: {
                    studentId,
                    semester: 0,
                    schoolYear: '',
                    source: 'manual',
                    verificationStatus: 'pending',
                    scores: academicRecords.grades,
                    verifiedAt: null,
                    verifiedBy: null,
                    notes: null
                }
            });

            // const flatSubjects = academicRecords.grades.map(grade => ({
            //     grade: grade.grade,
            //     subjects: Object.entries(grade).filter(([key]) => key !== 'grade')
            // }));

            // const createSubjects: any[] = [];

            // for (const subject of flatSubjects) {
            //     createSubjects.push(tx.subjectGrade.createMany({
            //         data: subject.subjects.map(([subjectSlug, grade]) => ({
            //             academicRecordId: newAcademicRecord.id,
            //             subjectId: allSubjects.find(subject => subject.code === subjectSlug)?.id as number,
            //             grade,
            //             score: 0
            //         }))
            //     }));
            // }

            // await Promise.all(createSubjects);
        }
    }

    private async saveStudentInfo(tx: Transaction, userId: number, draftData: RegistrationApiData) {
        const { studentInfo, residenceInfo } = draftData;

        const student = await tx.student.findFirst({
            where: {
                user: {
                    id: userId
                }
            }
        });     

        console.log('student', student);
        

        if (student) {
            return await tx.student.update({
                where: {
                    id: student.id
                },
                data: {
                    registration: {
                        update: {   
                            fullName: studentInfo.fullName || '',
                            dateOfBirth: studentInfo.dateOfBirth || new Date(),
                            gender: studentInfo.gender || 'male',
                            educationDepartment: studentInfo.educationDepartment || '',
                            primarySchool: studentInfo.primarySchool || '',
                            grade: studentInfo.grade || '',
                            placeOfBirth: studentInfo.placeOfBirth || '',
                            ethnicity: studentInfo.ethnicity || '',
                            permanentAddress: residenceInfo.permanentAddress || '',
                            temporaryAddress: residenceInfo.temporaryAddress || '',
                            currentAddress: residenceInfo.currentAddress || '',
                        }
                    }
                }
            });
        }

        return await tx.student.create({
            data: {
                userId: userId,
                registration: {
                    create: {
                        fullName: studentInfo.fullName || '',
                        dateOfBirth: studentInfo.dateOfBirth || new Date(),
                        gender: studentInfo.gender || 'male',
                        educationDepartment: studentInfo.educationDepartment || '',
                        primarySchool: studentInfo.primarySchool || '',
                        grade: studentInfo.grade || '',
                        placeOfBirth: studentInfo.placeOfBirth || '',
                        ethnicity: studentInfo.ethnicity || '',
                        permanentAddress: residenceInfo.permanentAddress || '',
                        temporaryAddress: residenceInfo.temporaryAddress,
                        currentAddress: residenceInfo.currentAddress || '',
                    }
                },
                application: {
                    create: {}
                }
            }
        });
    }

    private async saveParentInfo(tx: Transaction, userId: number, draftData: RegistrationApiData) {
        const { parentInfo } = draftData;

        // Check if parent info already exists
        const existingParentInfo = await tx.parentInfo.findUnique({
            where: { userId }
        });

        if (existingParentInfo) {



            return await tx.parentInfo.update({
                where: { userId },
                data: {
                    fatherName: parentInfo.fatherName,
                    fatherBirthYear: parentInfo.fatherBirthYear,
                    fatherPhone: parentInfo.fatherPhone,
                    fatherIdCard: parentInfo.fatherIdCard,
                    fatherOccupation: parentInfo.fatherOccupation,
                    fatherWorkplace: parentInfo.fatherWorkplace,
                    motherName: parentInfo.motherName,
                    motherBirthYear: parentInfo.motherBirthYear,
                    motherPhone: parentInfo.motherPhone,
                    motherIdCard: parentInfo.motherIdCard,
                    motherOccupation: parentInfo.motherOccupation,
                    motherWorkplace: parentInfo.motherWorkplace,
                    guardianName: parentInfo.guardianName,
                    guardianBirthYear: parentInfo.guardianBirthYear,
                    guardianPhone: parentInfo.guardianPhone,
                    guardianIdCard: parentInfo.guardianIdCard,
                    guardianOccupation: parentInfo.guardianOccupation,
                    guardianWorkplace: parentInfo.guardianWorkplace,
                    guardianRelationship: parentInfo.guardianRelationship,
                }
            });
        } else {
            return await tx.parentInfo.create({
                data: {
                    userId,
                    fatherName: parentInfo.fatherName,
                    fatherBirthYear: parentInfo.fatherBirthYear,
                    fatherPhone: parentInfo.fatherPhone,
                    fatherIdCard: parentInfo.fatherIdCard,
                    fatherOccupation: parentInfo.fatherOccupation,
                    fatherWorkplace: parentInfo.fatherWorkplace,
                    motherName: parentInfo.motherName,
                    motherBirthYear: parentInfo.motherBirthYear,
                    motherPhone: parentInfo.motherPhone,
                    motherIdCard: parentInfo.motherIdCard,
                    motherOccupation: parentInfo.motherOccupation,
                    motherWorkplace: parentInfo.motherWorkplace,
                    guardianName: parentInfo.guardianName,
                    guardianBirthYear: parentInfo.guardianBirthYear,
                    guardianPhone: parentInfo.guardianPhone,
                    guardianIdCard: parentInfo.guardianIdCard,
                    guardianOccupation: parentInfo.guardianOccupation,
                    guardianWorkplace: parentInfo.guardianWorkplace,
                    guardianRelationship: parentInfo.guardianRelationship,
                }
            });
        }
    }

    private async saveCommitment(tx: Transaction, studentId: number, commitmentData: NonNullable<RegistrationApiData['commitment']>) {
        // Check if commitment already exists for this student
        const existingCommitment = await tx.commitment.findUnique({
            where: { studentId }
        });

        if (existingCommitment) {
            return await tx.commitment.update({
                where: { studentId },
                data: {
                    relationship: commitmentData.relationship || '',
                    signatureDate: commitmentData.signatureDate || new Date(),
                    guardianName: commitmentData.guardianName || '',
                    applicantName: commitmentData.applicantName || ''
                }
            });
        } else {
            return await tx.commitment.create({
                data: {
                    studentId,
                    relationship: commitmentData.relationship || '',
                    signatureDate: commitmentData.signatureDate || new Date(),
                    guardianName: commitmentData.guardianName || '',
                    applicantName: commitmentData.applicantName || ''
                }
            });
        }
    }

    private async saveCompetitionResults(tx: Transaction, studentId: number, competitionResults: NonNullable<RegistrationApiData['competitionResults']>) {
        // First, delete any existing bonus points for this student
        await tx.bonusPoint.deleteMany({
            where: { studentId }
        });

        // Then create new bonus points
        const bonusPoints = competitionResults.map(result => {
            // Map competition levels and achievements to points
            let points = 0;
            switch (result.level) {
                case 'city':
                    points = result.achievement === 'first' ? 1.0 :
                        result.achievement === 'second' ? 0.75 :
                            result.achievement === 'third' ? 0.5 : 0;
                    break;
                case 'national':
                    points = result.achievement === 'first' ? 0.775 :
                        result.achievement === 'second' ? 0.5 :
                            result.achievement === 'third' ? 0.25 : 0;
                    break;
                case 'international':
                    points = result.achievement === 'first' ? 0 :
                        result.achievement === 'second' ? 0 :
                            result.achievement === 'third' ? 0 : 0;
                    break;
            }

            return {
                studentId,
                category: result.competitionId,
                level: result.level,
                achievement: result.achievement,
                points
            };
        });

        // Create all bonus points
        if (bonusPoints.length > 0) {
            await tx.bonusPoint.createMany({
                data: bonusPoints
            });
        }
    }

    async getRegistrationData(userId: number, studentId: number): Promise<RegistrationResponseDto> {

        return await prisma.$transaction(async (tx) => {
            const parentInfo = await tx.parentInfo.findFirst({
                where: { userId },
            });

            if (!parentInfo) {
                throw new Forbidden('parent_info_not_found', 'Parent information not found', 'Không tìm thấy thông tin phụ huynh');
            }

            const student = await tx.student.findFirst({
                where: { id: studentId },
                include: {
                    registration: true,
                    Commitment: true,
                    bonusPoints: true,
                    PriorityPoint: true,
                    academicRecords: {
                        include: {
                            grades: {
                                include: {
                                    subject: true
                                }   
                            }
                        }
                    },
                    application: {
                        include: {
                            ApplicationDocuments: {
                                include: {
                                    document: true 
                                }
                            }
                        }
                    },
                    grades: true,
                }
            });

            if (!student) {
                throw new Forbidden('student_not_found', 'Student not found', 'Không tìm thấy học sinh');
            }

            // transform academic records

            return {
                student: {
                    id: student.id,
                    userId: student.userId,
                    fullName: student.registration?.fullName || '',
                    dateOfBirth: student.registration?.dateOfBirth || new Date(),
                    gender: student.registration?.gender || 'male',
                    educationDepartment: student.registration?.educationDepartment || '',
                    primarySchool: student.registration?.primarySchool || '',
                    grade: student.registration?.grade || '',
                    placeOfBirth: student.registration?.placeOfBirth || '',
                    ethnicity: student.registration?.ethnicity || '',
                    permanentAddress: student.registration?.permanentAddress || '',
                    temporaryAddress: student.registration?.temporaryAddress || '',
                    currentAddress: student.registration?.currentAddress || '',
                    createdAt: student.createdAt,
                    updatedAt: student.updatedAt,
                    // ...student.registration,
                },
                parentInfo: {
                    id: parentInfo.id,
                    userId: parentInfo.userId,
                    fatherName: parentInfo.fatherName || '',
                    fatherBirthYear: parentInfo.fatherBirthYear || 0,
                    fatherPhone: parentInfo.fatherPhone || '',
                    fatherIdCard: parentInfo.fatherIdCard || '',
                    fatherOccupation: parentInfo.fatherOccupation || '',
                    fatherWorkplace: parentInfo.fatherWorkplace || '',
                    motherName: parentInfo.motherName || '',
                    motherBirthYear: parentInfo.motherBirthYear || 0,
                    motherPhone: parentInfo.motherPhone || '',
                    motherIdCard: parentInfo.motherIdCard || '',
                    motherOccupation: parentInfo.motherOccupation || '',
                    motherWorkplace: parentInfo.motherWorkplace || '',
                    guardianName: parentInfo.guardianName || '',
                    guardianBirthYear: parentInfo.guardianBirthYear || 0,
                    guardianPhone: parentInfo.guardianPhone || '',
                    guardianIdCard: parentInfo.guardianIdCard || '',
                    guardianOccupation: parentInfo.guardianOccupation || '',
                    guardianWorkplace: parentInfo.guardianWorkplace || '',
                    guardianRelationship: parentInfo.guardianRelationship || '',
                    createdAt: parentInfo.createdAt,
                    updatedAt: parentInfo.updatedAt,
                },
                application: student.application,
                grades: student.grades,
                priorityPoint: student.PriorityPoint[0],
                competitionResults: student.bonusPoints.map(point => ({
                    competitionId: point.category,
                    level: point.level,
                    achievement: point.achievement,
                    points: point.points,
                    year: new Date(point.createdAt).getFullYear(),
                })),
                commitment: student.Commitment?.[0],
                academicRecords: this.transformAcademicRecords(student.academicRecords)
            };
        });
    }

    transformAcademicRecords(academicRecords: Prisma.AcademicRecordGetPayload<{
        include: {
            grades: {
                include: {
                    subject: true
                }
            }
        }
    }>[]) {

        console.log('academicRecords', academicRecords);
        

        // Transform data về format mong muốn
        const transformedData = {
            academicRecords: {
                grades: academicRecords?.[0]?.scores as unknown as GradeDto[]
            }
        };
    
        return transformedData;
    }
}

export default new RegistrationService();