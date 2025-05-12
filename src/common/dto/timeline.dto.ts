import { TimelineType } from '../enums/timeline.enum';

export interface TimelineItemDto {
    id: number;
    title: string;
    startDate: Date;
    endDate: Date;
    description: string;
    status: 'active' | 'upcoming' | 'completed';
    type: TimelineType;
    color: string;
    alert: {
        title: string;
        content: string;
        type: 'info' | 'warning';
    };
    links: Array<{
        text: string;
        url: string;
    }>;
    hidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TimelineQueryDto {
    status?: 'active' | 'upcoming' | 'completed';
    hidden?: boolean;
    limit?: number;
    offset?: number;
}

export interface TimelineListResponseDto {
    items: TimelineItemDto[];
    total: number;
    pageSize: number;
    page: number;
}

export interface BulkOperationResponseDto {
    success: boolean;
    count: number;
    items: TimelineItemDto[];
}

export interface TimelineReorderDto {
    itemIds: number[];
}

export interface TimelineBatchUpdateDto {
    updates: Array<{
        id: number;
        data: Partial<TimelineItemDto>;
    }>;
}

export interface TimelineImportDto {
    items: Array<Omit<TimelineItemDto, 'id' | 'createdAt' | 'updatedAt'>>;
} 