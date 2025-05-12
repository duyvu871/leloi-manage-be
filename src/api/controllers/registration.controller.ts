import { Request, Response } from 'express';
// import { DraftFormData } from 'server/common/interfaces/registration.interface';
import BadRequest from 'server/responses/client-errors/bad-request';
import Unauthorized from 'server/responses/client-errors/unauthorized';
import Success from 'server/responses/success-response/success';
import AsyncMiddleware from 'server/shared/utils/async-handler';
import { RegistrationService } from 'services/registration.service';
import { 
    StudentIdParam, 
    RegistrationApiData 
} from 'validations/registration.validation';
import prisma from 'server/repositories/prisma';

class RegistrationController {
    private registrationService: RegistrationService;

    constructor() {
        this.registrationService = new RegistrationService();
    }

    submitDraft = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, RegistrationApiData>, res: Response) => {
            try {
                const draftData = req.body;
                const userId = req.userId;

                if (!userId) {
                    throw new Unauthorized('USER_NOT_FOUND', 'User not found', 'Không tìm thấy người dùng');
                }

                console.log('draftData', draftData);

                const result = await this.registrationService.saveRegistrationDraft(userId, draftData);

                const response = new Success(result).toJson;
                return res.status(201).json(response);
            } catch (error) {
                console.error('Error saving registration draft:', error);
                throw error;
            }
        }
    );

    getRegistrationData = AsyncMiddleware.asyncHandler(
        async (req: Request<StudentIdParam>, res: Response) => {            
            try {
                const userId = req.userId;
                const { studentId } = req.params;

                if (!userId) {
                    throw new Unauthorized('USER_NOT_FOUND', 'User not found', 'Không tìm thấy người dùng');
                }

                if (!studentId) {
                    throw new BadRequest('STUDENT_ID_REQUIRED', 'Student ID is required', 'Student ID là bắt buộc');
                }

                const studentIdInt = parseInt(studentId);   

                if (isNaN(studentIdInt)) {
                    throw new BadRequest('INVALID_STUDENT_ID', 'Invalid student ID', 'Student ID không hợp lệ');
                }

                // check if studentId is valid
                const student = await prisma.student.findFirst({
                    where: {
                        userId,
                        id: studentIdInt
                    }
                });

                if (!student) {
                    throw new BadRequest('STUDENT_NOT_FOUND', 'Student not found', 'Không tìm thấy học sinh');
                }

                const registrationData = await this.registrationService.getRegistrationData(userId, studentIdInt);

                const response = new Success(registrationData).toJson;
                return res.status(200).json(response);
            } catch (error) {
                console.error('Error getting registration data:', error);
                throw error;
            }
        }
    );
}

export default new RegistrationController();
