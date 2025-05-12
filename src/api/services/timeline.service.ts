import { PrismaClient } from '@prisma/client';
import { Transaction } from 'server/@types/prisma';
import prisma from 'repository/prisma';
import { TimelineItemDto, TimelineListResponseDto, BulkOperationResponseDto } from 'server/common/dto/timeline.dto';
import { CreateTimelineItem, UpdateTimelineItem, TimelineQuery } from 'validations/timeline.validation';
import NotFound from 'server/responses/client-errors/not-found';
import TimelineRedisService from './timeline-redis.service';
import config from 'config/app.config';

export class TimelineService {
    private prisma: PrismaClient;
    private redisService: TimelineRedisService;

    constructor() {
        this.prisma = prisma;
        this.redisService = TimelineRedisService.getInstance({
            host: config.redisHost,
            port: config.redisPort
        });
    }

    private transformToDto(item: any): TimelineItemDto {
        return {
            ...item,
            status: item.status as 'active' | 'upcoming' | 'completed',
            alert: item.alert ? JSON.parse(JSON.stringify(item.alert)) : null,
            links: item.links ? JSON.parse(JSON.stringify(item.links)) : []
        };
    }

    async listTimelineItems(query: TimelineQuery): Promise<TimelineListResponseDto> {
        const { status, hidden, limit = 10, offset = 0 } = query;

        const where = {
            ...(status && { status }),
            ...(typeof hidden === 'boolean' && { hidden })
        };

        const [items, total] = await Promise.all([
            this.prisma.timelineItem.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip: offset,
                take: limit
            }),
            this.prisma.timelineItem.count({ where })
        ]);

        return {
            items: items.map(this.transformToDto),
            total,
            pageSize: limit,
            page: Math.floor(offset / limit) + 1
        };
    }

    async getTimelineItem(id: number): Promise<TimelineItemDto> {
        const item = await this.prisma.timelineItem.findUnique({
            where: { id }
        });

        if (!item) {
            throw new NotFound(
                'TIMELINE_ITEM_NOT_FOUND',
                'Không tìm thấy mục thời gian',
                'Mục thời gian bạn yêu cầu không tồn tại trong hệ thống'
            );
        }

        return this.transformToDto(item);
    }

    async createTimelineItem(data: CreateTimelineItem): Promise<TimelineItemDto> {
        const item = await this.prisma.timelineItem.create({
            data: {
                ...data,
                links: data.links || [],
                hidden: data.hidden || false
            }
        });
        await this.redisService.invalidatePublicTimelineCache();
        return this.transformToDto(item);
    }

    async updateTimelineItem(id: number, data: UpdateTimelineItem): Promise<TimelineItemDto> {
        try {
            const item = await this.prisma.timelineItem.update({
                where: { id },
                data
            });
            await this.redisService.invalidatePublicTimelineCache();
            return this.transformToDto(item);
        } catch (error) {
            throw new NotFound(
                'TIMELINE_ITEM_NOT_FOUND',
                'Không tìm thấy mục thời gian',
                'Mục thời gian bạn muốn cập nhật không tồn tại trong hệ thống'
            );
        }
    }

    async deleteTimelineItem(id: number): Promise<void> {
        try {
            await this.prisma.timelineItem.delete({
                where: { id }
            });
            await this.redisService.invalidatePublicTimelineCache();
        } catch (error) {
            throw new NotFound(
                'TIMELINE_ITEM_NOT_FOUND',
                'Không tìm thấy mục thời gian',
                'Mục thời gian bạn muốn xóa không tồn tại trong hệ thống'
            );
        }
    }

    async toggleVisibility(id: number, hidden: boolean): Promise<TimelineItemDto> {
        try {
            const item = await this.prisma.timelineItem.update({
                where: { id },
                data: { hidden }
            });
            await this.redisService.invalidatePublicTimelineCache();
            return this.transformToDto(item);
        } catch (error) {
            throw new NotFound(
                'TIMELINE_ITEM_NOT_FOUND',
                'Không tìm thấy mục thời gian',
                'Mục thời gian bạn muốn thay đổi trạng thái không tồn tại trong hệ thống'
            );
        }
    }

    async importTimelineItems(items: CreateTimelineItem[]): Promise<BulkOperationResponseDto> {
        const createdItems = await this.prisma.$transaction(async (tx: Transaction) => {
            return await Promise.all(
                items.map(item => 
                    tx.timelineItem.create({
                        data: {
                            ...item,
                            links: item.links || [],
                            hidden: item.hidden || false
                        }
                    })
                )
            );
        });

        return {
            success: true,
            count: createdItems.length,
            items: createdItems.map(this.transformToDto)
        };
    }

    async exportTimelineItems(query: TimelineQuery): Promise<TimelineItemDto[]> {
        const { status, hidden } = query;
        
        const where = {
            ...(status && { status }),
            ...(typeof hidden === 'boolean' && { hidden })
        };

        const items = await this.prisma.timelineItem.findMany({
            where,
            orderBy: { createdAt: 'asc' }
        });

        return items.map(this.transformToDto);
    }

    async reorderTimelineItems(itemIds: number[]): Promise<BulkOperationResponseDto> {
        const items = await this.prisma.$transaction(async (tx: Transaction) => {
            const updatedItems = await Promise.all(
                itemIds.map((id, index) =>
                    tx.timelineItem.update({
                        where: { id },
                        data: { order: index }
                    })
                )
            );
            return updatedItems;
        });

        return {
            success: true,
            count: items.length,
            items: items.map(this.transformToDto)
        };
    }

    async batchUpdateTimelineItems(updates: { id: number; data: UpdateTimelineItem }[]): Promise<BulkOperationResponseDto> {
        const items = await this.prisma.$transaction(async (tx: Transaction) => {
            const updatedItems = await Promise.all(
                updates.map(({ id, data }) =>
                    tx.timelineItem.update({
                        where: { id },
                        data
                    })
                )
            );
            return updatedItems;
        });

        return {
            success: true,
            count: items.length,
            items: items.map(this.transformToDto)
        };
    }

    async getPublicTimeline(query: TimelineQuery): Promise<TimelineListResponseDto> {
        const { status, limit = 10, offset = 0 } = query;

        // Try to get from cache first
        const cachedData = await this.redisService.getCachedPublicTimeline(status, limit, offset);
        if (cachedData) {
            return cachedData;
        }

        // If not in cache, get from database
        const where = {
            hidden: false,
            ...(status && { status })
        };

        const [items, total] = await Promise.all([
            this.prisma.timelineItem.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip: offset,
                take: limit
            }),
            this.prisma.timelineItem.count({ where })
        ]);

        const result = {
            items: items.map(this.transformToDto),
            total,
            pageSize: limit,
            page: Math.floor(offset / limit) + 1
        };

        // Cache the result
        await this.redisService.cachePublicTimeline(status, limit, offset, result);

        return result;
    }
}

export default new TimelineService(); 