import { Redis, RedisOptions } from 'ioredis';
import logger from 'util/logger';

export default class RedisService {
    protected redis: Redis;
    protected readonly keyPrefix: string;

    constructor(options: RedisOptions, keyPrefix: string = '') {
        this.redis = new Redis(options);
        this.keyPrefix = keyPrefix;

        // Set up error handling
        this.redis.on('error', (error) => {
            logger.error(`Redis connection error: ${error}`);
        });

        this.redis.on('connect', () => {
            logger.info('Redis connected successfully');
        });
    }

    /**
     * Get the full key with prefix
     * @param key The base key
     * @returns The prefixed key
     */
    protected getKey(key: string): string {
        return `${this.keyPrefix}${key}`;
    }

    /**
     * Set a value in Redis
     * @param key The key to set
     * @param value The value to set
     * @param ttl Optional TTL in seconds
     */
    protected async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            const fullKey = this.getKey(key);

            if (ttl) {
                await this.redis.setex(fullKey, ttl, serializedValue);
            } else {
                await this.redis.set(fullKey, serializedValue);
            }
        } catch (error) {
            logger.error(`Error setting Redis key ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Get a value from Redis
     * @param key The key to get
     * @returns The value or null if not found
     */
    protected async get<T>(key: string): Promise<T | null> {
        try {
            const fullKey = this.getKey(key);
            const value = await this.redis.get(fullKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Error getting Redis key ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a key from Redis
     * @param key The key to delete
     * @returns True if key was deleted, false otherwise
     */
    protected async delete(key: string): Promise<boolean> {
        try {
            const fullKey = this.getKey(key);
            const result = await this.redis.del(fullKey);
            return result === 1;
        } catch (error) {
            logger.error(`Error deleting Redis key ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Check if a key exists in Redis
     * @param key The key to check
     * @returns True if key exists, false otherwise
     */
    protected async exists(key: string): Promise<boolean> {
        try {
            const fullKey = this.getKey(key);
            const result = await this.redis.exists(fullKey);
            return result === 1;
        } catch (error) {
            logger.error(`Error checking Redis key ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Set a hash field
     * @param key The hash key
     * @param field The field to set
     * @param value The value to set
     */
    protected async hset(key: string, field: string, value: any): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            const fullKey = this.getKey(key);
            await this.redis.hset(fullKey, field, serializedValue);
        } catch (error) {
            logger.error(`Error setting Redis hash field ${key}.${field}: ${error}`);
            throw error;
        }
    }

    /**
     * Get a hash field
     * @param key The hash key
     * @param field The field to get
     * @returns The value or null if not found
     */
    protected async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const fullKey = this.getKey(key);
            const value = await this.redis.hget(fullKey, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Error getting Redis hash field ${key}.${field}: ${error}`);
            throw error;
        }
    }

    /**
     * Get all hash fields
     * @param key The hash key
     * @returns Object containing all fields and values
     */
    protected async hgetall<T>(key: string): Promise<Record<string, T> | null> {
        try {
            const fullKey = this.getKey(key);
            const result = await this.redis.hgetall(fullKey);
            if (!result || Object.keys(result).length === 0) {
                return null;
            }
            return Object.entries(result).reduce((acc, [field, value]) => {
                acc[field] = JSON.parse(value);
                return acc;
            }, {} as Record<string, T>);
        } catch (error) {
            logger.error(`Error getting all Redis hash fields for ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a hash field
     * @param key The hash key
     * @param field The field to delete
     * @returns True if field was deleted, false otherwise
     */
    protected async hdel(key: string, field: string): Promise<boolean> {
        try {
            const fullKey = this.getKey(key);
            const result = await this.redis.hdel(fullKey, field);
            return result === 1;
        } catch (error) {
            logger.error(`Error deleting Redis hash field ${key}.${field}: ${error}`);
            throw error;
        }
    }

    /**
     * Set multiple hash fields for an object
     * @param key The hash key
     * @param obj The object to store
     */
    protected async hmset(key: string, obj: Record<string, any>): Promise<void> {
        try {
            const fullKey = this.getKey(key);
            const pipeline = this.redis.pipeline();
            
            for (const [field, value] of Object.entries(obj)) {
                const serializedValue = JSON.stringify(value);
                pipeline.hset(fullKey, field, serializedValue);
            }

            await pipeline.exec();
        } catch (error) {
            logger.error(`Error setting Redis hash fields for ${key}: ${error}`);
            throw error;
        }
    }

    /**
     * Close the Redis connection
     */
    public async close(): Promise<void> {
        await this.redis.quit();
        logger.info('Redis connection closed');
    }
}