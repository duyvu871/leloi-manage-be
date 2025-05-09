import { PrismaClient } from '@prisma/client';
import { DraftFormData } from 'server/common/interfaces/registration.interface';
import prisma from 'repository/prisma';
import { Transaction } from 'server/@types/prisma';
import e from 'express';
import { RegistrationResponseDto } from 'server/common/dto/registration.dto';
import Forbidden from 'server/responses/client-errors/forbidden';

export class RegistrationService {
    async saveRegistrationDraft(userId: number, draftData: DraftFormData) {
        return await prisma.$transaction(async (tx) => {
            // 1. Save student information
            const student = await this.saveStudentInfo(tx, userId, draftData);

            // 2. Save parent information
            await this.saveParentInfo(tx, userId, draftData);

            // 3. Save commitment if provided
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

    private async saveStudentInfo(tx: Transaction, userId: number, draftData: DraftFormData) {
        const { studentInfo, residenceInfo } = draftData;

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

    private async saveParentInfo(tx: Transaction, userId: number, draftData: DraftFormData) {
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

    private async saveCommitment(tx: Transaction, studentId: number, commitmentData: NonNullable<DraftFormData['commitment']>) {
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

    private async saveCompetitionResults(tx: Transaction, studentId: number, competitionResults: NonNullable<DraftFormData['competitionResults']>) {
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

    async getRegistrationData(userId: number, studentId): Promise<RegistrationResponseDto> {

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
                parentInfo,
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
            };
        });
    }
}

export default new RegistrationService();