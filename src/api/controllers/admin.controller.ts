import { Request, Response } from 'express';
import AsyncMiddleware from 'shared/utils/async-handler';
import Success from 'responses/success-response/success';
import adminService from 'services/admin.service';
import {
    StudentIdParam,
    StudentFilter,
    UpdateStudentStatus,
    UpdateStudentInfo
} from 'validations/admin.validation';
import { StudentStatus } from 'common/enums/admin.enum';
import Unauthorized from 'responses/client-errors/unauthorized';
import BadRequest from 'responses/client-errors/bad-request';

class AdminController {
    /**
     * Get dashboard statistics
     */
    getDashboardStats = AsyncMiddleware.asyncHandler(
        async (_req: Request, res: Response) => {
            const stats = await adminService.getDashboardStats();
            const response = new Success(stats).message('Thống kê tổng quan').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get detailed statistics
     */
    getDetailedStats = AsyncMiddleware.asyncHandler(
        async (_req: Request, res: Response) => {
            const stats = await adminService.getDetailedStats();
            const response = new Success(stats).message('Thống kê chi tiết').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get a paginated list of students
     */
    listStudents = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const filter: StudentFilter = {
                search: req.query.search as string | undefined,
                status: req.query.status as StudentStatus | undefined,
                gender: req.query.gender as any,
                school: req.query.school as string | undefined,
                page: req.query.page as string | '1',
                limit: req.query.limit as string | '10'
            };
            
            const students = await adminService.listStudents(filter);
            const response = new Success(students).message('Danh sách học sinh').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get detailed information about a student
     */
    getStudentDetails = AsyncMiddleware.asyncHandler(
        async (req: Request<StudentIdParam>, res: Response) => {
            const { id } = req.params;
            const studentId = parseInt(id);
            
            if (isNaN(studentId)) {
                throw new BadRequest(
                    'INVALID_STUDENT_ID',
                    'Invalid student ID',
                    'Mã học sinh không hợp lệ'
                );
            }
            
            const student = await adminService.getStudentDetails(studentId);
            const response = new Success(student).message('Thông tin chi tiết học sinh').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Update a student's status
     */
    updateStudentStatus = AsyncMiddleware.asyncHandler(
        async (req: Request<StudentIdParam, {}, UpdateStudentStatus>, res: Response) => {
            const { id } = req.params;
            const data = req.body;
            
            const studentId = parseInt(id);
            
            if (isNaN(studentId)) {
                throw new BadRequest(
                    'INVALID_STUDENT_ID',
                    'Invalid student ID',
                    'Mã học sinh không hợp lệ'
                );
            }
            
            const result = await adminService.updateStudentStatus(studentId, data);
            const message = `Cập nhật trạng thái học sinh thành ${data.status}`;
            const response = new Success(result).message(message).toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get pending review students
     */
    getPendingReviewStudents = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const search = req.query.search as string | undefined;
            const students = await adminService.getPendingReviewStudents(search);
            const response = new Success(students).message('Danh sách học sinh cần xử lý').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Verify student by ID
     */
    verifyStudentById = AsyncMiddleware.asyncHandler(
        async (req: Request, res: Response) => {
            const studentId = req.query.studentId as string;
            
            if (!studentId) {
                throw new BadRequest(
                    'STUDENT_ID_REQUIRED',
                    'Student ID is required',
                    'Vui lòng nhập mã học sinh'
                );
            }
            
            const student = await adminService.verifyStudentById(studentId);
            const response = new Success(student).message('Thông tin học sinh').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Update student information
     */
    updateStudentInfo = AsyncMiddleware.asyncHandler(
        async (req: Request<StudentIdParam, {}, UpdateStudentInfo>, res: Response) => {
            const { id } = req.params;
            const data = req.body;
            
            const studentId = parseInt(id);
            
            if (isNaN(studentId)) {
                throw new BadRequest(
                    'INVALID_STUDENT_ID',
                    'Invalid student ID',
                    'Mã học sinh không hợp lệ'
                );
            }
            
            const result = await adminService.updateStudentInfo(studentId, data);
            const response = new Success(result).message('Cập nhật thông tin học sinh thành công').toJson;
            return res.status(200).json(response);
        }
    );

    /**
     * Get student documents
     */
    getStudentDocuments = AsyncMiddleware.asyncHandler(
        async (req: Request<StudentIdParam>, res: Response) => {
            const { id } = req.params;
            const studentId = parseInt(id);
            
            if (isNaN(studentId)) {
                throw new BadRequest(
                    'INVALID_STUDENT_ID',
                    'Invalid student ID',
                    'Mã học sinh không hợp lệ'
                );
            }
            
            const documents = await adminService.getStudentDocuments(studentId);
            const response = new Success(documents).message('Danh sách tài liệu của học sinh').toJson;
            return res.status(200).json(response);
        }
    );
}

export default new AdminController(); 