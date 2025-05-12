import { FeedbackType, FeedbackStatus } from '../enums/feedback.enum';

export interface FeedbackDto {
    id: number;
    type: FeedbackType;
    content: string;
    needSupport: boolean;
    needCallback: boolean;
    isUrgent: boolean;
    status: FeedbackStatus;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
}

export interface CreateFeedbackDto {
    type: FeedbackType;
    content: string;
    needSupport: boolean;
    needCallback: boolean;
    isUrgent: boolean;
}

export interface UpdateFeedbackStatusDto {
    status: FeedbackStatus;
}

export interface FeedbackQueryDto {
    type?: FeedbackType;
    status?: FeedbackStatus;
    isUrgent?: boolean;
    needCallback?: boolean;
    page?: number;
    pageSize?: number;
    search?: string;
    searchFields?: string;
    orderBy?: string;
    filterBy?: string;
}

export interface FeedbackListResponseDto {
    data: FeedbackDto[];
    page: number;
    total: number;
    totalPage: number;
} 