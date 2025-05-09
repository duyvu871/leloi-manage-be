import { NotificationChannel, NotificationPriority, NotificationType } from "../interfaces/notification.service.interface";

// Response DTOs
export interface NotificationResponseDto {
    id: number;
    userId: number;
    title: string;
    content: string;
    htmlContent?: string;
    description?: string;
    type: NotificationType;
    priority: NotificationPriority;
    isRead: boolean;
    metadata?: Record<string, any>;
    readAt?: Date;
    sentVia: NotificationChannel[];
    createdAt: Date;
    updatedAt: Date;
}

export interface GetNotificationsResponseDto {
    notifications: NotificationResponseDto[];
    total: number;
}

export interface SendNotificationResponseDto {
    success: boolean;
    details?: any;
    error?: any;
}

export interface BroadcastNotificationResponseDto {
    success: boolean;
    details: {
        total: number;
        successful: number;
        failed: number;
        results: SendNotificationResponseDto[];
    };
}

export interface MarkAsReadResponseDto {
    success: boolean;
}

export interface DeleteNotificationsResponseDto {
    success: boolean;
} 