import { z } from 'zod';
import { TimelineType } from 'common/enums/timeline.enum';

// Schema for link object
const linkSchema = z.object({
    text: z.string().min(1, { message: 'Văn bản liên kết không được để trống' }),
    url: z.string().url({ message: 'URL không hợp lệ' })
});

// Schema for alert object
const alertSchema = z.object({
    title: z.string().min(1, { message: 'Tiêu đề cảnh báo không được để trống' }),
    content: z.string().min(1, { message: 'Nội dung cảnh báo không được để trống' }),
    type: z.enum(['info', 'warning'], { 
        errorMap: () => ({ message: 'Loại cảnh báo phải là info hoặc warning' })
    })
});

// Base timeline item schema
const timelineItemBaseSchema = z.object({
    title: z.string().min(1, { message: 'Tiêu đề không được để trống' }),
    startDate: z.string().datetime({
        message: 'Ngày bắt đầu không hợp lệ'
    }),
    endDate: z.string().datetime({
        message: 'Ngày kết thúc không hợp lệ'
    }),
    description: z.string().min(1, { message: 'Mô tả không được để trống' }),
    status: z.enum(['active', 'upcoming', 'completed'], {
        errorMap: () => ({ message: 'Trạng thái không hợp lệ' })
    }),
    type: z.nativeEnum(TimelineType, {
        errorMap: () => ({ message: 'Loại thời gian biểu không hợp lệ' })
    }),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { 
        message: 'Mã màu phải là mã hex hợp lệ (ví dụ: #FF0000)' 
    }),
    alert: alertSchema,
    links: z.array(linkSchema),
    hidden: z.boolean()
}).refine(data => data.startDate <= data.endDate, {
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    path: ['endDate']
}).innerType();

// Query parameters validation
export const timelineQuerySchema = z.object({
    status: z.enum(['active', 'upcoming', 'completed']).optional(),
    hidden: z.boolean().optional(),
    limit: z.number().int().positive().optional(),
    offset: z.number().int().min(0).optional()
});

// Create timeline item validation
export const createTimelineSchema = timelineItemBaseSchema;

// Update timeline item validation
export const updateTimelineSchema = timelineItemBaseSchema.partial();

// ID parameter validation
export const timelineIdSchema = z.object({
    id: z.string().regex(/^\d+$/, {
        message: 'ID mục thời gian không hợp lệ'
    })
});

// Visibility toggle validation
export const toggleVisibilitySchema = z.object({
    hidden: z.boolean()
});

// Reorder items validation
export const reorderTimelineSchema = z.object({
    itemIds: z.array(z.number().int().positive())
        .min(1, { message: 'Cần ít nhất một ID mục thời gian' })
});

// Batch update validation
export const batchUpdateSchema = z.object({
    updates: z.array(z.object({
        id: z.number().int().positive(),
        data: updateTimelineSchema
    })).min(1, { message: 'Cần ít nhất một cập nhật' })
});

// Import validation
export const importTimelineSchema = z.object({
    items: z.array(timelineItemBaseSchema)
        .min(1, { message: 'Cần ít nhất một mục thời gian' })
});

// Transform dates to ISO string for API responses
export const transformDates = (data: any) => ({
    ...data,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString()
});

// Export types
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type CreateTimelineItem = z.infer<typeof createTimelineSchema>;
export type UpdateTimelineItem = z.infer<typeof updateTimelineSchema>;
export type TimelineId = z.infer<typeof timelineIdSchema>;
export type ToggleVisibility = z.infer<typeof toggleVisibilitySchema>;
export type ReorderTimeline = z.infer<typeof reorderTimelineSchema>;
export type BatchUpdateTimeline = z.infer<typeof batchUpdateSchema>;
export type ImportTimeline = z.infer<typeof importTimelineSchema>; 