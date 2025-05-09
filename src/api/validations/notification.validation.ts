import { z } from "zod";

export class NotificationValidation {

    public static recipientId = z.object({
        recipientId: z.string({
            required_error: "Recipient ID is required",
            invalid_type_error: "Recipient ID must be a string"
        }).min(1, "Recipient ID cannot be empty")
    }); 

    public static sendNotification = z.object({
        title: z.string({
            required_error: "Title is required",
            invalid_type_error: "Title must be a string"
        }).min(1, "Title cannot be empty"),
        message: z.string({
            required_error: "Message is required",
            invalid_type_error: "Message must be a string"
        }).min(1, "Message cannot be empty"),
        htmlContent: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['SYSTEM', 'ADMIN', 'DOCUMENT', 'APPLICATION'] as const).optional(),
        priority: z.enum(['HIGH', 'NORMAL', 'LOW'] as const).optional(),
        metadata: z.record(z.any()).optional(),
        channels: z.array(z.enum(['DATABASE', 'EMAIL', 'TELEGRAM'] as const)).optional()
    });

    public static broadcastNotification = z.object({
        recipientIds: z.array(z.number(), {
            required_error: "Recipient IDs are required",
            invalid_type_error: "Recipient IDs must be an array of numbers"
        }).min(1, "At least one recipient ID is required"),
        payload: z.lazy(() => NotificationValidation.sendNotification)
    });

    public static markAsRead = z.object({
        notificationIds: z.array(z.number(), {
            required_error: "Notification IDs are required",
            invalid_type_error: "Notification IDs must be an array of numbers"
        }).min(1, "At least one notification ID is required")
    });

    public static deleteNotifications = z.object({
        notificationIds: z.array(z.number(), {
            required_error: "Notification IDs are required",
            invalid_type_error: "Notification IDs must be an array of numbers"
        }).min(1, "At least one notification ID is required")
    });

    public static getNotificationsQuery = z.object({
        isRead: z.boolean().optional(),
        type: z.enum(['SYSTEM', 'ADMIN', 'DOCUMENT', 'APPLICATION'] as const).optional(),
        priority: z.enum(['HIGH', 'NORMAL', 'LOW'] as const).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().optional()
    });
}

// Type definitions from zod schemas
export type SendNotificationRequest = z.infer<typeof NotificationValidation.sendNotification>;
export type BroadcastNotificationRequest = z.infer<typeof NotificationValidation.broadcastNotification>;
export type MarkAsReadRequest = z.infer<typeof NotificationValidation.markAsRead>;
export type DeleteNotificationsRequest = z.infer<typeof NotificationValidation.deleteNotifications>;
export type GetNotificationsQuery = z.infer<typeof NotificationValidation.getNotificationsQuery>; 
export type RecipientId = z.infer<typeof NotificationValidation.recipientId>;