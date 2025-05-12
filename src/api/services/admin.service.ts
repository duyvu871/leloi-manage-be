import { PrismaClient } from '@prisma/client';
import prisma from 'repository/prisma';
import { 
    StudentListItemDto, 
    AdminDashboardStatsDto, 
    StudentDetailDto, 
    PaginatedResponseDto,
    PendingReviewStudentDto,
    ExamInfo,
    DetailedStatsDto,
    UpdateStudentInfoDto,
    StudentDocumentDto
} from 'common/dto/admin.dto';
import { 
    StudentFilter, 
    UpdateStudentStatus,
    UpdateStudentInfo
} from 'validations/admin.validation';
import { StudentStatus, Gender } from 'common/enums/admin.enum';
import NotFound from 'responses/client-errors/not-found';
import BadRequest from 'responses/client-errors/bad-request';
import { Transaction } from 'server/@types/prisma';
import { GradeDto } from 'server/common/dto/registration.dto';

export class AdminService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<AdminDashboardStatsDto> {
        const [
            totalApplications,
            eligibleCount,
            ineligibleCount,
            pendingCount,
            confirmedCount
        ] = await Promise.all([
            this.prisma.application.count(),
            this.prisma.applicationDocument.count({
                where: { 
                    status: 'approved',
                    isEligible: true 
                }
            }),
            this.prisma.applicationDocument.count({
                where: { 
                    status: 'rejected',
                    isEligible: false
                }
            }),
            this.prisma.applicationDocument.count({
                where: { 
                    status: 'pending'
                }
            }),
            this.prisma.applicationDocument.count({
                where: { 
                    status: 'approved',
                    verificationDate: { not: null }
                }
            })
        ]);

        return {
            totalApplications,
            eligibleCount,
            ineligibleCount,
            pendingCount,
            confirmedCount
        };
    }

    /**
     * Get detailed statistics
     */
    async getDetailedStats(): Promise<DetailedStatsDto> {
        const [
            totalApplications,
            eligibleCount,
            ineligibleCount,
            processingCount,
            confirmedCount
        ] = await Promise.all([
            this.prisma.student.count(),
            this.prisma.application.count({
                where: {
                    ApplicationDocuments: {
                        some: {
                            status: 'approved',
                            isEligible: true
                        }
                    }
                }
            }),
            this.prisma.application.count({
                where: {
                    ApplicationDocuments: {
                        some: {
                            status: 'rejected',
                            isEligible: false
                        }
                    }
                }
            }),
            this.prisma.application.count({
                where: {
                    ApplicationDocuments: {
                        some: {
                            status: 'pending'
                        }
                    }
                }
            }),
            this.prisma.application.count({
                where: {
                    ApplicationDocuments: {
                        some: {
                            status: 'approved',
                            verificationDate: { not: null }
                        }
                    }
                }
            })
        ]);

        return {
            totalApplications,
            eligibleCount,
            ineligibleCount,
            processingCount,
            confirmedCount
        };
    }

    /**
     * Get a paginated list of students
     */
    async listStudents(filter: StudentFilter): Promise<PaginatedResponseDto<StudentListItemDto>> {
        const { 
            search, 
            status, 
            gender, 
            school, 
            page = 1, 
            limit = 10 
        } = filter;

        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);

        // Build filters
        const where: any = {};

        if (search) {
            where.OR = [
                { registration: { fullName: { contains: search, mode: 'insensitive' } } },
                { id: { equals: isNaN(parseInt(search)) ? undefined : parseInt(search) } }
            ];
        }

        if (gender) {
            where.registration = {
                ...where.registration,
                gender
            };
        }

        if (school) {
            where.registration = {
                ...where.registration,
                primarySchool: { contains: school, mode: 'insensitive' }
            };
        }

        // Status filtering is on the application document
        if (status) {
            if (status === StudentStatus.ELIGIBLE) {
                where.application = {
                    ApplicationDocuments: {
                        some: {
                            status: 'approved',
                            isEligible: true
                        }
                    }
                };
            } else if (status === StudentStatus.INELIGIBLE) {
                where.application = {
                    ApplicationDocuments: {
                        some: {
                            status: 'rejected',
                            isEligible: false
                        }
                    }
                };
            } else if (status === StudentStatus.PENDING) {
                where.application = {
                    ApplicationDocuments: {
                        some: {
                            status: 'pending'
                        }
                    }
                };
            } else if (status === StudentStatus.CONFIRMED) {
                where.application = {
                    ApplicationDocuments: {
                        some: {
                            status: 'approved',
                            verificationDate: { not: null }
                        }
                    }
                };
            }
        }

        // Count total items
        const total = await this.prisma.student.count({ where });

        // Calculate pagination
        const skip = (pageNumber - 1) * limitNumber;
        const totalPages = Math.ceil(total / limitNumber);

        // Fetch items
        const students = await this.prisma.student.findMany({
            where,
            include: {
                registration: true,
                application: {
                    include: {
                        ApplicationDocuments: true
                    }
                }
            },
            skip,
            take: limitNumber,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to DTO
        const items = students.map(student => {
            // Determine status
            let status = StudentStatus.PENDING;
            let statusReason = '';
            let lastUpdated = student.updatedAt;
            
            const appDoc = student.application?.ApplicationDocuments[0];
            
            if (appDoc) {
                if (appDoc.status === 'approved' && appDoc.isEligible) {
                    status = StudentStatus.ELIGIBLE;
                } else if (appDoc.status === 'rejected' || !appDoc.isEligible) {
                    status = StudentStatus.INELIGIBLE;
                    statusReason = appDoc.rejectionReason || '';
                } else if (appDoc.status === 'approved' && appDoc.verificationDate) {
                    status = StudentStatus.CONFIRMED;
                }
                
                if (appDoc.updatedAt) {
                    lastUpdated = appDoc.updatedAt;
                }
            }

            return {
                id: student.id,
                studentId: `HS${student.id.toString().padStart(6, '0')}`,
                name: student.registration?.fullName || '',
                dob: student.registration?.dateOfBirth || new Date(),
                gender: (student.registration?.gender as Gender) || Gender.MALE,
                currentSchool: student.registration?.primarySchool || '',
                status,
                statusReason,
                lastUpdated
            };
        });

        return {
            data: items,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages
        };
    }

    /**
     * Get detailed information about a student
     */
    async getStudentDetails(id: number): Promise<StudentDetailDto> {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                registration: true,
                application: {
                    include: {
                        ApplicationDocuments: {
                            include: {
                                document: true
                            }
                        }
                    }
                },
                user: true,
                grades: {
                    include: {
                        subject: true
                    }
                },
                academicRecords: true
            }
        });

        if (!student) {
            throw new NotFound(
                'STUDENT_NOT_FOUND',
                'Student not found',
                'Không tìm thấy học sinh'
            );
        }

        // Get parent info
        const parentInfo = await this.prisma.parentInfo.findUnique({
            where: { userId: student.userId }
        });

        if (!parentInfo) {
            throw new NotFound(
                'PARENT_INFO_NOT_FOUND',
                'Parent information not found',
                'Không tìm thấy thông tin phụ huynh'
            );
        }

        // Build transcript data
        const subjects = student.grades.map(grade => ({
            name: grade.subject?.name || 'Chưa xác định',
            score: grade.score,
            evaluation: ''
        }));

        // Determine student status
        let status = StudentStatus.PENDING;
        let statusReason = '';
        let lastUpdated = student.updatedAt;
        let examInfo: ExamInfo | undefined;
        
        const appDoc = student.application?.ApplicationDocuments[0];
        
        if (appDoc) {
            if (appDoc.status === 'approved' && appDoc.isEligible) {
                status = StudentStatus.ELIGIBLE;
            } else if (appDoc.status === 'rejected' || !appDoc.isEligible) {
                status = StudentStatus.INELIGIBLE;
                statusReason = appDoc.rejectionReason || '';
            } else if (appDoc.status === 'approved' && appDoc.verificationDate) {
                status = StudentStatus.CONFIRMED;
            }
            
            if (appDoc.updatedAt) {
                lastUpdated = appDoc.updatedAt;
            }

            // Mock exam info for eligible or confirmed students
            if (status === StudentStatus.ELIGIBLE || status === StudentStatus.CONFIRMED) {
                examInfo = {
                    sbd: `TS${student.id.toString().padStart(6, '0')}`,
                    room: `P${Math.floor(Math.random() * 10) + 201}`,
                    date: "2025-05-20",
                    time: "08:00 - 11:30"
                };
            }
        }

        // Get certificates (documents of type 'certificate')
        const certificates = student.application?.ApplicationDocuments
            .filter(appDoc => appDoc.type === 'certificate')
            .map(appDoc => appDoc.document?.name || '')
            .filter(Boolean) || [];

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
                temporaryAddress: student.registration?.temporaryAddress || undefined,
                currentAddress: student.registration?.currentAddress || '',
                examNumber: student.registration?.examNumber || undefined,
                examRoom: student.registration?.examRoom || undefined,
                studentCode: student.registration?.studentCode || undefined,
                identificationNumber: student.registration?.identificationNumber || undefined,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt
            },
            parent: {
                id: parentInfo.id,
                userId: parentInfo.userId,
                fatherName: parentInfo.fatherName || undefined,
                fatherBirthYear: parentInfo.fatherBirthYear || undefined,
                fatherPhone: parentInfo.fatherPhone || undefined,
                fatherIdCard: parentInfo.fatherIdCard || undefined,
                fatherOccupation: parentInfo.fatherOccupation || undefined,
                fatherWorkplace: parentInfo.fatherWorkplace || undefined,
                motherName: parentInfo.motherName || undefined,
                motherBirthYear: parentInfo.motherBirthYear || undefined,
                motherPhone: parentInfo.motherPhone || undefined,
                motherIdCard: parentInfo.motherIdCard || undefined,
                motherOccupation: parentInfo.motherOccupation || undefined,
                motherWorkplace: parentInfo.motherWorkplace || undefined,
                guardianName: parentInfo.guardianName || undefined,
                guardianBirthYear: parentInfo.guardianBirthYear || undefined,
                guardianPhone: parentInfo.guardianPhone || undefined,
                guardianIdCard: parentInfo.guardianIdCard || undefined,
                guardianOccupation: parentInfo.guardianOccupation || undefined,
                guardianWorkplace: parentInfo.guardianWorkplace || undefined,
                guardianRelationship: parentInfo.guardianRelationship || undefined,
                createdAt: parentInfo.createdAt,
                updatedAt: parentInfo.updatedAt
            },
            application: student.application ? {
                id: student.application.id,
                studentId: student.application.studentId,
                createdAt: student.application.createdAt,
                updatedAt: student.application.updatedAt
            } : null,
            transcriptData: {
                subjects,
                behavior: 'Tốt',
                attendanceRate: '95%',
                teacherComments: 'Học sinh có tinh thần học tập tốt.'
            },
            status: {
                currentStatus: status,
                reason: statusReason,
                lastUpdated,
                examInfo
            },
            academicRecords: {
                grades: student.academicRecords?.[0]?.scores as unknown as GradeDto[]
            },
            certificates
        };
    }

    /**
     * Update a student's status
     */
    async updateStudentStatus(id: number, data: UpdateStudentStatus): Promise<StudentDetailDto> {
        return await this.prisma.$transaction(async (tx: Transaction) => {
            const student = await tx.student.findUnique({
                where: { id },
                include: {
                    application: true
                }
            });
    
            if (!student) {
                throw new NotFound(
                    'STUDENT_NOT_FOUND',
                    'Student not found',
                    'Không tìm thấy học sinh'
                );
            }
    
            if (!student.application) {
                throw new NotFound(
                    'APPLICATION_NOT_FOUND',
                    'Application not found',
                    'Không tìm thấy hồ sơ đăng ký'
                );
            }
    
            // Update application status
            const { status, reason, examInfo } = data;
            
            let appDocStatus: string;
            let isEligible: boolean;
            let verificationDate: Date | null = null;
    
            switch (status) {
                case StudentStatus.ELIGIBLE:
                    appDocStatus = 'approved';
                    isEligible = true;
                    break;
                case StudentStatus.INELIGIBLE:
                    appDocStatus = 'rejected';
                    isEligible = false;
                    break;
                case StudentStatus.CONFIRMED:
                    appDocStatus = 'approved';
                    isEligible = true;
                    verificationDate = new Date();
                    break;
                default:
                    appDocStatus = 'pending';
                    isEligible = false;
            }
    
            // Update application document
            await tx.applicationDocument.updateMany({
                where: { applicationId: student.application.id },
                data: {
                    status: appDocStatus,
                    isEligible,
                    rejectionReason: reason,
                    verificationDate
                }
            });
    
            // If eligible or confirmed and exam info is provided, update student registration
            if ((status === StudentStatus.ELIGIBLE || status === StudentStatus.CONFIRMED) && examInfo) {
                await tx.studentRegistration.update({
                    where: { studentId: student.id },
                    data: {
                        examNumber: examInfo.sbd,
                        examRoom: examInfo.room
                    }
                });
            }
    
            // Return updated student details
            return this.getStudentDetails(id);
        });
    }

    /**
     * Get pending review students
     */
    async getPendingReviewStudents(search?: string): Promise<PendingReviewStudentDto[]> {
        const where: any = {
            application: {
                ApplicationDocuments: {
                    some: {
                        status: 'pending'
                    }
                }
            }
        };

        if (search) {
            where.OR = [
                { registration: { fullName: { contains: search, mode: 'insensitive' } } },
                { id: { equals: isNaN(parseInt(search)) ? undefined : parseInt(search) } }
            ];
        }

        const students = await this.prisma.student.findMany({
            where,
            include: {
                registration: true,
                application: {
                    include: {
                        ApplicationDocuments: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return students.map(student => {
            const appDoc = student.application?.ApplicationDocuments[0];

            return {
                id: student.id,
                studentId: `HS${student.id.toString().padStart(6, '0')}`,
                name: student.registration?.fullName || '',
                reason: appDoc?.rejectionReason || 'Đang chờ xử lý',
                lastUpdated: appDoc?.updatedAt || student.updatedAt
            };
        });
    }

    /**
     * Verify student by ID
     */
    async verifyStudentById(studentId: string): Promise<StudentDetailDto> {
        // Extract numeric part if in format HSxxxxxx
        const numericId = studentId.startsWith('HS') 
            ? parseInt(studentId.substring(2)) 
            : parseInt(studentId);

        if (isNaN(numericId)) {
            throw new BadRequest(
                'INVALID_STUDENT_ID',
                'Invalid student ID',
                'Mã học sinh không hợp lệ'
            );
        }

        return this.getStudentDetails(numericId);
    }

    /**
     * Update student information
     */
    async updateStudentInfo(id: number, data: UpdateStudentInfo): Promise<StudentDetailDto> {
        return await this.prisma.$transaction(async (tx: Transaction) => {
            const student = await tx.student.findUnique({
                where: { id }
            });

            if (!student) {
                throw new NotFound(
                    'STUDENT_NOT_FOUND',
                    'Student not found',
                    'Không tìm thấy học sinh'
                );
            }

            // Update student registration information
            await tx.studentRegistration.update({
                where: { studentId: id },
                data: {
                    fullName: data.fullName,
                    dateOfBirth: data.dateOfBirth,
                    gender: data.gender,
                    educationDepartment: data.educationDepartment,
                    primarySchool: data.primarySchool,
                    grade: data.grade,
                    placeOfBirth: data.placeOfBirth,
                    ethnicity: data.ethnicity,
                    permanentAddress: data.permanentAddress,
                    temporaryAddress: data.temporaryAddress,
                    currentAddress: data.currentAddress,
                    examNumber: data.examNumber,
                    examRoom: data.examRoom,
                    studentCode: data.studentCode,
                    identificationNumber: data.identificationNumber
                }
            });

            // Return updated student details
            return this.getStudentDetails(id);
        });
    }

    /**
     * Get student documents
     */
    async getStudentDocuments(id: number): Promise<StudentDocumentDto[]> {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        ApplicationDocuments: {
                            include: {
                                document: true
                            }
                        }
                    }
                }
            }
        });

        if (!student) {
            throw new NotFound(
                'STUDENT_NOT_FOUND',
                'Student not found',
                'Không tìm thấy học sinh'
            );
        }

        if (!student.application) {
            throw new NotFound(
                'APPLICATION_NOT_FOUND',
                'Application not found',
                'Không tìm thấy hồ sơ đăng ký'
            );
        }

        return student.application.ApplicationDocuments
            .filter(doc => doc.document !== null)
            .map(doc => ({
                id: doc.id,
                documentId: doc.documentId,
                applicationId: doc.applicationId,
                document: {
                    id: doc.document!.id,
                    name: doc.document!.name,
                    description: doc.document!.description || undefined,
                    url: doc.document!.url,
                    type: doc.document!.type,
                    filePath: doc.document!.filePath,
                    fileSize: doc.document!.fileSize,
                    mimeType: doc.document!.mimeType,
                    uploadedAt: doc.document!.uploadedAt
                },
                type: doc.type,
                status: doc.status as 'pending' | 'approved' | 'rejected',
                isEligible: doc.isEligible,
                rejectionReason: doc.rejectionReason || undefined,
                verificationDate: doc.verificationDate || undefined,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
            }));
    }
}

export default new AdminService(); 