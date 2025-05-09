import { Request, Response } from 'express';
import { DraftFormData } from 'server/common/interfaces/registration.interface';
import Unauthorized from 'server/responses/client-errors/unauthorized';
import Success from 'server/responses/success-response/success';
import AsyncMiddleware from 'server/shared/utils/async-handler';
import { RegistrationService } from 'services/registration.service';
import { 
    StudentIdParam, 
    RegistrationApiData 
} from 'validations/registration.validation';

class RegistrationController {
    private registrationService: RegistrationService;

    constructor() {
        this.registrationService = new RegistrationService();
    }

    submitDraft = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, DraftFormData>, res: Response) => {
            try {
                const draftData = req.body;
                const userId = req.userId;

                if (!userId) {
                    throw new Unauthorized('USER_NOT_FOUND', 'User not found', 'Không tìm thấy người dùng');
                }

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

                const registrationData = await this.registrationService.getRegistrationData(userId, studentId);

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
