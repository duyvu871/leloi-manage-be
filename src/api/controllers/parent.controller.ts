import { Request, Response } from 'express';
import AsyncMiddleware from 'util/async-handler';
import Success from 'server/responses/success-response/success';
import BadRequest from 'server/responses/client-errors/bad-request';
import ParentService from 'services/parent.service';
import { StudentDto, ApplicationDto } from 'common/interfaces/parent.interface';

export class ParentController {
    private parentService: ParentService;

    constructor() {
        this.parentService = new ParentService();
    }

    /**
     * Add student information
     * @param req Express request object
     * @param res Express response object
     */
    addStudent = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const studentData: StudentDto = req.body;
            const result = await this.parentService.addStudent(userId, studentData);
            const response = new Success(result).toJson;
            return res.status(201).json(response);
        }
    );

    /**
     * Get list of students for current parent
     * @param req Express request object
     * @param res Express response object
     */
    getStudents = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.getStudents(userId);
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get student details by ID
     * @param req Express request object
     * @param res Express response object
     */
    getStudentById = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const { studentId } = req.params;
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.getStudentById(userId, parseInt(studentId));
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Create application for student
     * @param req Express request object
     * @param res Express response object
     */
    createApplication = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const applicationData: ApplicationDto = req.body;
            const result = await this.parentService.createApplication(userId, applicationData);
            const response = new Success(result).toJson;
            return res.status(201).json(response);
        }
    );

    /**
     * Get list of applications
     * @param req Express request object
     * @param res Express response object
     */
    getApplications = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.getApplications(userId);
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get application details by ID
     * @param req Express request object
     * @param res Express response object
     */
    getApplicationById = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const { applicationId } = req.params;
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.getApplicationById(userId, parseInt(applicationId));
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Upload document for application
     * @param req Express request object
     * @param res Express response object
     */
    uploadDocument = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const file = req.file as Express.Multer.File;
            const { applicationId, type } = req.body;
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.uploadDocument(userId, parseInt(applicationId), file, type);
            const response = new Success(result).toJson;
            return res.status(201).json(response);
        }
    );

    /**
     * Get available schedules
     * @param req Express request object
     * @param res Express response object
     */
    getSchedules = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.getSchedules();
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Book a schedule slot
     * @param req Express request object
     * @param res Express response object
     */
    bookSchedule = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const { applicationId, scheduleSlotId } = req.body;
            const userId = req?.userId;
            if (!userId) throw new BadRequest('Invalid_user_id', 'Invalid user ID', 'Invalid user ID');

            const result = await this.parentService.bookSchedule(userId, parseInt(applicationId), parseInt(scheduleSlotId));
            const response = new Success(result).toJson;
            return res.status(200).json(response);
        }
    );
}