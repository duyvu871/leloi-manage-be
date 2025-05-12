import { Request, Response } from 'express';
import AsyncMiddleware from 'shared/utils/async-handler';
import Success from 'responses/success-response/success';
import { FeedbackService } from 'services/feedback.service';
import {
    CreateFeedbackData,
    UpdateFeedbackStatusData,
    FeedbackIdParam,
    FeedbackQueryParams
} from 'validations/feedback.validation';
import Unauthorized from 'responses/client-errors/unauthorized';
import { transformExpressParamsForPrismaWithTimeRangeBase } from 'server/shared/helpers/pagination-parse';
import prisma from 'repository/prisma';
import { PaginationQuery } from '../validations/pagination.validation';

class FeedbackController {
    private feedbackService: FeedbackService;

    constructor() {
        this.feedbackService = new FeedbackService();
    }

    submitFeedback = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, CreateFeedbackData>, res: Response) => {
            const userId = req.userId;
            if (!userId) {
                throw new Unauthorized('USER_NOT_FOUND', 'User not found', 'Không tìm thấy người dùng');
            }

            const data = req.body;
            const result = await this.feedbackService.createFeedback(userId, data);
            const response = new Success(result).message('Gửi phản hồi thành công').toJson;
            return res.status(201).json(response);
        }
    );

    getFeedbackList = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
            const query = req.query;
            const queryParse = transformExpressParamsForPrismaWithTimeRangeBase('feedback', query, prisma);
            const result = await this.feedbackService.getFeedbackList(queryParse);
            const response = new Success(result).message('Lấy danh sách phản hồi thành công').toJson;
            return res.status(200).json(response);
        }
    );

    updateFeedbackStatus = AsyncMiddleware.asyncHandler(
        async (req: Request<FeedbackIdParam, {}, UpdateFeedbackStatusData>, res: Response) => {
            const { id } = req.params;
            const data = req.body;
            const result = await this.feedbackService.updateFeedbackStatus(Number(id), data);
            const response = new Success(result).message('Cập nhật trạng thái phản hồi thành công').toJson;
            return res.status(200).json(response);
        }
    );
}

export default new FeedbackController(); 