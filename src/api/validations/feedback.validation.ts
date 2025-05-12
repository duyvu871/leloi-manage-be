import { z } from 'zod';
import { FeedbackType, FeedbackStatus } from 'common/enums/feedback.enum';

export const createFeedbackSchema = z.object({
    type: z.nativeEnum(FeedbackType, {
        errorMap: () => ({ message: 'Loại phản hồi không hợp lệ' })
    }),
    content: z.string().min(1, { message: 'Nội dung không được để trống' }),
    needSupport: z.boolean(),
    needCallback: z.boolean(),
    isUrgent: z.boolean()
});

export const updateFeedbackStatusSchema = z.object({
    status: z.nativeEnum(FeedbackStatus, {
        errorMap: () => ({ message: 'Trạng thái không hợp lệ' })
    })
});

export const feedbackIdSchema = z.object({
    id: z.string().regex(/^\d+$/, {
        message: 'ID phản hồi không hợp lệ'
    })
});

export const feedbackQuerySchema = z.object({
    type: z.nativeEnum(FeedbackType).optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
    isUrgent: z.boolean().optional(),
    needCallback: z.boolean().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    search: z.string().optional(),
    searchFields: z.string().optional(),
    orderBy: z.string().optional(),
    filterBy: z.string().optional()
});

export type CreateFeedbackData = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusData = z.infer<typeof updateFeedbackStatusSchema>;
export type FeedbackIdParam = z.infer<typeof feedbackIdSchema>;
export type FeedbackQueryParams = z.infer<typeof feedbackQuerySchema>; 