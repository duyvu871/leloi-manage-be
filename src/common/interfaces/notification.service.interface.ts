import { PrismaPaginationOptions } from "server/shared/helpers/pagination-parse";
import { Notification } from "@prisma/client";

export type NotificationType = 'SYSTEM' | 'ADMIN' | 'DOCUMENT' | 'APPLICATION';
export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW';
export type NotificationChannel = 'DATABASE' | 'EMAIL' | 'TELEGRAM';

export interface NotificationPayload {
  title: string;
  message: string;
  htmlContent?: string;
  description?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  channels?: NotificationChannel[];
}

export interface NotificationSendOptions {
  parseMode?: 'MarkdownV2' | 'HTML';
  silent?: boolean;
  scheduleFor?: Date;
}

export interface NotificationFilter {
  userId?: number;
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationService {
  // Send a notification to a specific user
  sendNotification(
    recipientId: string | number, // User ID or specific channel address
    payload: NotificationPayload,
    options?: NotificationSendOptions,
  ): Promise<{ success: boolean; details?: any; error?: any }>;

  // Send a notification to multiple users
  broadcastNotification(
    recipientIds: (string | number)[],
    payload: NotificationPayload,
    options?: NotificationSendOptions,
  ): Promise<{ success: boolean; details?: any; error?: any }>;

  // Mark notifications as read
  markAsRead(
    notificationIds: number[],
    userId: number
  ): Promise<void>;

  // Get notifications for a user
  getNotifications(
    userId: number,
    filter: PrismaPaginationOptions<'notification'>
  ): Promise<{ notifications: Notification[]; total: number }>;

  // Delete notifications
  deleteNotifications(
    notificationIds: number[],
    userId: number
  ): Promise<void>;
}

// Configuration interfaces for different notification channels
export interface TelegramNotificationConfig {
  botToken: string;
  defaultRecipientId?: string;
}

export interface EmailNotificationConfig {
  from: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface NotificationServiceConfig {
  telegram?: TelegramNotificationConfig;
  email?: EmailNotificationConfig;
  defaultChannels?: NotificationChannel[];
} 