import { Readable } from 'stream';
import { Client } from 'minio';
import { getMinioClient } from 'loader/minio.loader';
import { storageConfig } from 'config/storage.config';
import { StudentDto, ApplicationDto } from 'common/interfaces/parent.interface';
import logger from 'util/logger';
import BadRequest from 'responses/client-errors/bad-request';
import InternalServerError from 'responses/server-errors/internal-server-error';
import prisma from 'repository/prisma';
import { PrismaClient } from '@prisma/client';

/**
 * Service class for handling parent-related operations
 * Provides functionality for managing students, applications, and documents
 */
export default class ParentService {
    private minioClient: Client;
    private prisma: PrismaClient;

    /**
     * Initializes the ParentService with MinIO client and Prisma instance
     */
    constructor() {
        this.minioClient = getMinioClient();
        this.prisma = prisma
    }

    /**
     * Add a new student
     * @param userId - Parent's user ID
     * @param studentData - Student information
     * @returns Promise containing student details
     */
    public async addStudent(userId: string | number, studentData: StudentDto) {
        try {
            const student = await this.prisma.student.create({
                data: {
                    userId: Number(userId),
                    fullName: studentData.fullName,
                    dateOfBirth: new Date(studentData.dateOfBirth),
                    gender: studentData.gender,
                    studentCode: studentData.studentCode,
                    // Adding required fields from schema
                    educationDepartment: studentData.educationDepartment,
                    primarySchool: studentData.primarySchool,
                    grade: studentData.grade,
                    placeOfBirth: studentData.placeOfBirth,
                    ethnicity: studentData.ethnicity,
                    permanentAddress: studentData.permanentAddress,
                    currentAddress: studentData.currentAddress,
                    // Optional fields
                    temporaryAddress: studentData.temporaryAddress,
                    examNumber: studentData.examNumber,
                    examRoom: studentData.examRoom,
                    identificationNumber: studentData.identificationNumber
                }
            });

            return student;
        } catch (error) {
            logger.error('Error adding student:', error);
            throw error;
        }
    }

    /**
     * Get list of students for a parent
     * @param userId - Parent's user ID
     * @returns Promise containing array of students
     */
    public async getStudents(userId: string | number) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: Number(userId) },
                include: { students: true }
            });

            if (!user) {
                throw new BadRequest('USER_NOT_FOUND', 'User not found', 'User record not found');
            }

            return user.students;
        } catch (error) {
            logger.error('Error getting students:', error);
            throw error;
        }
    }

    /**
     * Get student details by ID
     * @param userId - Parent's user ID
     * @param studentId - Student's ID
     * @returns Promise containing student details
     */
    public async getStudentById(userId: string | number, studentId: number) {
        try {
            const student = await this.prisma.student.findFirst({
                where: {
                    id: studentId,
                    userId: Number(userId)
                },
                include: {
                    application: true
                }
            });

            if (!student) {
                throw new BadRequest('STUDENT_NOT_FOUND', 'Student not found', 'Student record not found');
            }

            return student;
        } catch (error) {
            logger.error('Error getting student:', error);
            throw error;
        }
    }

    /**
     * Create a new application
     * @param userId - Parent's user ID
     * @param applicationData - Application information
     * @returns Promise containing application details
     */
    public async createApplication(userId: string | number, applicationData: ApplicationDto) {
        try {
            const student = await this.prisma.student.findFirst({
                where: {
                    id: applicationData.studentId,
                    userId: Number(userId)
                }
            });

            if (!student) {
                throw new BadRequest('STUDENT_NOT_FOUND', 'Student not found', 'Student record not found');
            }

            const existingApplication = await this.prisma.application.findUnique({
                where: { studentId: student.id }
            });

            if (existingApplication) {
                throw new BadRequest('APPLICATION_EXISTS', 'Application exists', 'Student already has an application');
            }

            const application = await this.prisma.application.create({
                data: {
                    studentId: student.id,
                    status: 'pending',
                    isEligible: false
                }
            });

            return application;
        } catch (error) {
            logger.error('Error creating application:', error);
            throw error;
        }
    }

    /**
     * Get list of applications for a parent
     * @param userId - Parent's user ID
     * @returns Promise containing array of applications
     */
    public async getApplications(userId: string | number) {
        try {
            const applications = await this.prisma.application.findMany({
                where: {
                    student: {
                        userId: Number(userId)
                    }
                },
                include: {
                    student: true,
                    documents: true,
                    scheduleSlot: true
                }
            });

            return applications;
        } catch (error) {
            logger.error('Error getting applications:', error);
            throw error;
        }
    }

    /**
     * Get application details by ID
     * @param userId - Parent's user ID
     * @param applicationId - Application's ID
     * @returns Promise containing application details
     */
    public async getApplicationById(userId: string | number, applicationId: number) {
        try {
            const application = await this.prisma.application.findFirst({
                where: {
                    id: applicationId,
                    student: {
                        userId: Number(userId)
                    }
                },
                include: {
                    student: true,
                    documents: true,
                    scheduleSlot: true
                }
            });

            if (!application) {
                throw new BadRequest('APPLICATION_NOT_FOUND', 'Application not found', 'Application record not found');
            }

            return application;
        } catch (error) {
            logger.error('Error getting application:', error);
            throw error;
        }
    }

    /**
     * Upload document for application
     * @param userId - Parent's user ID
     * @param applicationId - Application's ID
     * @param file - Document file
     * @param type - Document type
     * @returns Promise containing document details
     */
    public async uploadDocument(userId: string | number, applicationId: number, file: Express.Multer.File, type: string) {
        try {
            const application = await this.getApplicationById(userId, applicationId);

            if (!file) {
                throw new BadRequest('FILE_REQUIRED', 'File is required', 'No file was provided for upload');
            }

            if (!file.buffer || !file.originalname || !file.size || !file.mimetype) {
                throw new BadRequest('INVALID_FILE', 'Invalid file format', 'The provided file is missing required properties');
            }

            const fileId = this.generateFileId(file.originalname);
            const fileStream = Readable.from(file.buffer);

            const objectKey = `applications/${applicationId}/documents/${fileId}`;
            await this.minioClient.putObject(
                storageConfig.bucketName,
                objectKey,
                fileStream,
                file.size,
                { 'Content-Type': file.mimetype }
            );

            const document = await this.prisma.document.create({
                data: {
                    applicationId: application.id,
                    type,
                    filePath: objectKey,
                    fileSize: file.size,
                    mimeType: file.mimetype
                }
            });

            return document;
        } catch (error) {
            logger.error('Error uploading document:', error);
            throw error;
        }
    }

    /**
     * Get available schedules
     * @returns Promise containing array of schedules
     */
    public async getSchedules() {
        try {
            const schedules = await this.prisma.schedule.findMany({
                where: {
                    isActive: true,
                    endDate: {
                        gte: new Date()
                    }
                },
                include: {
                    slots: {
                        where: {
                            isFilled: false
                        }
                    }
                }
            });

            return schedules;
        } catch (error) {
            logger.error('Error getting schedules:', error);
            throw error;
        }
    }

    /**
     * Book a schedule slot
     * @param userId - Parent's user ID
     * @param applicationId - Application's ID
     * @param scheduleSlotId - Schedule slot's ID
     * @returns Promise containing updated schedule slot
     */
    public async bookSchedule(userId: string | number, applicationId: number, scheduleSlotId: number) {
        try {
            const application = await this.getApplicationById(userId, applicationId);

            const slot = await this.prisma.scheduleSlot.findUnique({
                where: { id: scheduleSlotId }
            });

            if (!slot) {
                throw new BadRequest('SLOT_NOT_FOUND', 'Schedule slot not found', 'Schedule slot not found');
            }

            if (slot.isFilled) {
                throw new BadRequest('SLOT_FILLED', 'Schedule slot is filled', 'Schedule slot is already booked');
            }

            const updatedSlot = await this.prisma.scheduleSlot.update({
                where: { id: scheduleSlotId },
                data: {
                    applicationId: application.id,
                    isFilled: true
                }
            });

            return updatedSlot;
        } catch (error) {
            logger.error('Error booking schedule:', error);
            throw error;
        }
    }

    /**
     * Generates a unique file ID based on timestamp and original filename
     * @param originalName - Original name of the uploaded file
     * @returns Generated unique file ID
     * @private
     */
    private generateFileId(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
        return `${timestamp}-${randomString}-${sanitizedName}`;
    }
}