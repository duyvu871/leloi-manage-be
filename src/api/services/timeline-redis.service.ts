import RedisService from './redis.service';
import { RedisOptions } from 'ioredis';
import { TimelineListResponseDto } from 'server/common/dto/timeline.dto';
import logger from 'util/logger';

export class TimelineRedisService extends RedisService {
    private static instance: TimelineRedisService;
    private readonly CACHE_TTL = 60 * 5; // 5 minutes cache

    private constructor(options: RedisOptions) {
        super(options, 'timeline:'); // Add prefix for timeline keys
    }

    public static getInstance(options: RedisOptions): TimelineRedisService {
        if (!TimelineRedisService.instance) {
            TimelineRedisService.instance = new TimelineRedisService(options);
        }
        return TimelineRedisService.instance;
    }

    /**
     * Generate cache key for public timeline
     */
    private getPublicTimelineKey(status: string | undefined, limit: number, offset: number): string {
        return `public:${status || 'all'}:${limit}:${offset}`;
    }

    /**
     * Cache public timeline data
     */
    public async cachePublicTimeline(
        status: string | undefined,
        limit: number,
        offset: number,
        data: TimelineListResponseDto
    ): Promise<void> {
        const key = this.getPublicTimelineKey(status, limit, offset);
        try {
            await this.set(key, data, this.CACHE_TTL);
            logger.info(`Cached public timeline data for key: ${key}`);
        } catch (error) {
            logger.error(`Failed to cache public timeline data: ${error}`);
            // Don't throw error - let the app continue even if caching fails
        }
    }

    /**
     * Get cached public timeline data
     */
    public async getCachedPublicTimeline(
        status: string | undefined,
        limit: number,
        offset: number
    ): Promise<TimelineListResponseDto | null> {
        const key = this.getPublicTimelineKey(status, limit, offset);
        try {
            const data = await this.get<TimelineListResponseDto>(key);
            if (data) {
                logger.info(`Cache hit for public timeline key: ${key}`);
            } else {
                logger.info(`Cache miss for public timeline key: ${key}`);
            }
            return data;
        } catch (error) {
            logger.error(`Failed to get cached public timeline data: ${error}`);
            return null;
        }
    }

    /**
     * Invalidate public timeline cache
     * This should be called when timeline items are modified
     */
    public async invalidatePublicTimelineCache(): Promise<void> {
        try {
            const pattern = this.getKey('public:*');
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger.info(`Invalidated ${keys.length} public timeline cache keys`);
            }
        } catch (error) {
            logger.error(`Failed to invalidate public timeline cache: ${error}`);
            // Don't throw error - let the app continue even if cache invalidation fails
        }
    }
}

export default TimelineRedisService; 