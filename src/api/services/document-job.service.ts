import { DocumentProcessJob } from 'common/interfaces/document-process.interface';
import logger from 'util/logger';
import appConfig from 'server/configs/app.config';
import RedisService from './redis.service';

export default class DocumentJobService extends RedisService {
    constructor() {
        super(
            {
                host: appConfig.redisHost,
                port: appConfig.redisPort,
            },
            'document_job:'
        );
    }

    /**
     * Create a new document job
     * @param job The job data to create
     * @returns Promise<DocumentProcessJob>
     */
    public async createJob(job: DocumentProcessJob<any>): Promise<DocumentProcessJob<any>> {
        try {
            const { id, ...jobFields } = job;
            const fieldsToStore: Record<string, string> = {};

            for (const key in jobFields) {
                if (Object.prototype.hasOwnProperty.call(jobFields, key)) {
                    const value = (jobFields as any)[key];
                    if (key === 'result' && typeof value === 'object' && value !== null) {
                        fieldsToStore[key] = JSON.stringify(value);
                    } else if (value instanceof Date) {
                        fieldsToStore[key] = value.toISOString();
                    } else if (typeof value !== 'undefined' && value !== null) {
                        fieldsToStore[key] = String(value);
                    }
                }
            }
            await this.redis.hmset(this.getKey(id), fieldsToStore);
            return job;
        } catch (error) {
            logger.error(`Error creating document job: ${error}`);
            throw error;
        }
    }

    /**
     * Get a document job by ID
     * @param jobId The ID of the job to get
     * @returns Promise<DocumentProcessJob | null>
     */
    public async getJob(jobId: string): Promise<DocumentProcessJob<any> | null> {
        try {
            const jobData = await this.redis.hgetall(this.getKey(jobId));
            if (Object.keys(jobData).length === 0) return null;

            const typedJobData: Partial<DocumentProcessJob<any>> = {};
            for (const key in jobData) {
                if (Object.prototype.hasOwnProperty.call(jobData, key)) {
                    const value = jobData[key];
                    if (key === 'createdAt' || key === 'updatedAt') {
                        (typedJobData as any)[key] = new Date(value);
                    } else if (key === 'userId' || key === 'fileId' || key === 'applicationDocumentId') {
                        (typedJobData as any)[key] = parseInt(value, 10);
                    } else if (key === 'result' || key === 'error' || key === 'status' || key === 'type' || key === 'fileName' || key === 'fileUrl' || key === 'path') {
                        (typedJobData as any)[key] = value;
                    }
                }
            }
            
            return {
                id: jobId,
                ...typedJobData
            } as DocumentProcessJob<any>;
        } catch (error) {
            logger.error(`Error getting document job: ${error}`);
            throw error;
        }
    }

    /**
     * Update a document job
     * @param jobId The ID of the job to update
     * @param updates Partial updates to apply to the job
     * @returns Promise<DocumentProcessJob | null>
     */
    public async updateJob<T>(jobId: string, updates: Partial<DocumentProcessJob<T>>): Promise<DocumentProcessJob<T> | null> {
        try {
            const jobKey = this.getKey(jobId);
            const jobExists = await this.redis.exists(jobKey);
            
            if (!jobExists) {
                logger.warn(`Job with ID ${jobId} not found for update.`);
                return null;
            }

            const fieldsToUpdate: Record<string, string> = {};
            const finalUpdates = {
                ...updates,
                updatedAt: new Date() as any
            };

            for (const key in finalUpdates) {
                if (Object.prototype.hasOwnProperty.call(finalUpdates, key)) {
                    const value = (finalUpdates as any)[key];
                    if (key === 'id') continue;

                    if (key === 'result' && typeof value === 'object' && value !== null) {
                        fieldsToUpdate[key] = JSON.stringify(value);
                    } else if (value instanceof Date) {
                        fieldsToUpdate[key] = value.toISOString();
                    } else if (typeof value !== 'undefined' && value !== null) {
                        fieldsToUpdate[key] = String(value);
                    } else if (value === null) {
                        fieldsToUpdate[key] = '';
                    }
                }
            }
            
            if (Object.keys(fieldsToUpdate).length > 0) {
                 await this.redis.hmset(jobKey, fieldsToUpdate);
            }
           
            return this.getJob(jobId) as Promise<DocumentProcessJob<T> | null>;
        } catch (error) {
            logger.error(`Error updating document job: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a document job
     * @param jobId The ID of the job to delete
     * @returns Promise<boolean>
     */
    public async deleteJob(jobId: string): Promise<boolean> {
        try {
            const result = await this.redis.del(this.getKey(jobId));
            return result > 0;
        } catch (error) {
            logger.error(`Error deleting document job: ${error}`);
            throw error;
        }
    }

    /**
     * Update job status and related data
     * @param jobId The ID of the job to update
     * @param status The new status
     * @param result Optional result data, now expected to be string as per DocumentProcessJob interface
     * @param error Optional error message
     */
    public async updateJobStatus(
        jobId: string,
        status: DocumentProcessJob<any>['status'],
        result?: any,
        error?: string
    ): Promise<void> {
        try {
            const updates: Partial<DocumentProcessJob<any>> = {
                status,
                updatedAt: new Date()
            };

            if (typeof result !== 'undefined') {
                if (typeof result === 'object' && result !== null) {
                    updates.result = JSON.stringify(result);
                } else {
                    updates.result = String(result);
                }
            }

            if (error) {
                updates.error = error;
            } else {
                updates.error = '';
            }

            await this.updateJob(jobId, updates);
        } catch (error) {
            logger.error(`Error updating job status: ${error}`);
            throw error;
        }
    }

    /**
     * Close the Redis connection
     */
    public async close(): Promise<void> {
        await this.redis.quit();
    }
}