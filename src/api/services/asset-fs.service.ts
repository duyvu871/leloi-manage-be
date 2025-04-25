import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { AssetMetadata, AssetUploadResponse, GetFileByIdResponse } from 'common/interfaces/asset-upload.interface';
import logger from 'util/logger';
import BadRequest from 'responses/client-errors/bad-request';
import InternalServerError from 'responses/server-errors/internal-server-error';
import appConfig from 'server/configs/app.config';

/**
 * Service class for handling file uploads to filesystem storage
 * Provides functionality for uploading, retrieving, and managing files
 */
export default class AssetFsService {
    private baseStoragePath: string;
    private baseUrl: string;

    /**
     * Initializes the AssetFsService with storage path configuration
     */
    constructor() {
        // Set base storage path - using the storage/assets directory from project root
        this.baseStoragePath = path.resolve(process.cwd(), 'storage', 'assets');
        this.baseUrl = appConfig.assetsUrl || 'http://localhost:8080/storage';
        
        // Ensure storage directories exist
        this.ensureStorageDirectories();
    }

    /**
     * Ensures that necessary storage directories exist
     * @private
     */
    private async ensureStorageDirectories(): Promise<void> {
        try {
            // Ensure base storage path exists
            await fs.mkdir(this.baseStoragePath, { recursive: true });
            logger.info(`Storage directory ensured at: ${this.baseStoragePath}`);
        } catch (error) {
            logger.error('Error ensuring storage directories:', error);
            throw new InternalServerError(
                'STORAGE_INIT_FAILED',
                'Failed to initialize storage',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Uploads a file to filesystem storage with associated metadata
     * @param file - The file to upload (must be a Multer file object)
     * @param userId - The ID of the user uploading the file
     * @param metadata - Optional additional metadata to store with the file
     * @returns Promise containing upload response with file details
     * @throws {BadRequest} When file is missing or invalid
     * @throws {InternalServerError} When upload fails
     */
    public async uploadFile(file: Express.Multer.File, userId: string | number, metadata?: Record<string, unknown>): Promise<AssetUploadResponse['data'] & {filePath: string}> {
        if (!file) {
            throw new BadRequest('FILE_REQUIRED', 'File is required', 'No file was provided for upload');
        }

        if (!file.buffer || !file.originalname || !file.size || !file.mimetype) {
            throw new BadRequest('INVALID_FILE', 'Invalid file format', 'The provided file is missing required properties');
        }

        try {
            // Generate a unique file ID
            const fileId = this.generateFileId(file.originalname);
            
            // Create user directory if it doesn't exist
            const userDir = path.join(this.baseStoragePath, `users/${userId}`);
            await fs.mkdir(userDir, { recursive: true });
            
            // Define file path
            const filePath = path.join(userDir, fileId);
            
            // Write file to disk
            await fs.writeFile(filePath, file.buffer);
            
            // Create metadata file
            const assetMetadata: AssetMetadata = {
                original_name: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                uploaded_at: new Date(),
                user_id: userId,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            };
            
            // Write metadata to a separate JSON file
            const metadataPath = `${filePath}.meta.json`;
            await fs.writeFile(metadataPath, JSON.stringify(assetMetadata, null, 2));
            
            logger.info(`File uploaded successfully: ${fileId}`);
            
            // Generate URL for the file
            const fileUrl = this.generateFileUrl(userId.toString(), fileId);
            
            return {
                fileId,
                fileName: file.originalname,
                fileSize: file.size,
                mimetype: file.mimetype,
                filePath: filePath,
                url: fileUrl,
                metadata
            };
        } catch (error) {
            logger.error('Error uploading file:', error);
            throw new InternalServerError(
                'UPLOAD_FAILED',
                'Failed to upload file',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    // public async uploadFileToProcess()

    /**
     * Generates a unique file ID based on timestamp, random string, and original filename
     * @param originalName - Original name of the uploaded file
     * @returns Generated unique file ID
     * @private
     */
    private generateFileId(originalName: string): string {
        const timestamp = Date.now();
        const randomString = uuidv4().substring(0, 8);
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
        return `${timestamp}-${randomString}-${sanitizedName}`;
    }

    /**
     * Generates a URL for accessing the file
     * @param userId - The ID of the user who owns the file
     * @param fileId - The ID of the file to generate URL for
     * @returns The URL for accessing the file
     * @private
     */
    private generateFileUrl(userId: string, fileId: string): string {
        return `${this.baseUrl}/users/${userId}/${fileId}`;
    }

    /**
     * Retrieves a list of files for a specific user with pagination support
     * @param userId - The ID of the user whose files to retrieve
     * @param limit - Maximum number of files to return (default: 100)
     * @param marker - Pagination marker for retrieving next set of files
     * @returns Promise containing array of file details and next marker if available
     * @throws {InternalServerError} When file retrieval fails
     */
    public async getFiles(userId: string | number, limit: number = 100, marker?: string): Promise<{ files: GetFileByIdResponse['data'][], nextMarker?: string }> {
        try {
            const userDir = path.join(this.baseStoragePath, `users/${userId}`);
            
            // Check if user directory exists
            try {
                await fs.access(userDir);
            } catch (error) {
                // If directory doesn't exist, return empty array
                return { files: [] };
            }
            
            // Get all files in the directory
            const dirEntries = await fs.readdir(userDir, { withFileTypes: true });
            
            // Filter out metadata files and directories
            const fileEntries = dirEntries.filter(entry => 
                entry.isFile() && !entry.name.endsWith('.meta.json')
            );
            
            // Sort files by name (which includes timestamp)
            fileEntries.sort((a, b) => a.name.localeCompare(b.name));
            
            // Apply marker-based pagination
            let startIndex = 0;
            if (marker) {
                const markerIndex = fileEntries.findIndex(entry => entry.name > marker);
                if (markerIndex !== -1) {
                    startIndex = markerIndex;
                }
            }
            
            // Apply limit
            const paginatedEntries = fileEntries.slice(startIndex, startIndex + limit);
            
            // Get file details
            const files: GetFileByIdResponse['data'][] = [];
            for (const entry of paginatedEntries) {
                const fileId = entry.name;
                const filePath = path.join(userDir, fileId);
                const metadataPath = `${filePath}.meta.json`;
                
                try {
                    // Read metadata
                    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                    const metadata = JSON.parse(metadataContent) as AssetMetadata;
                    
                    // Get file stats
                    const stats = await fs.stat(filePath);
                    
                    files.push({
                        fileId,
                        fileName: metadata.original_name,
                        fileSize: metadata.size,
                        mimetype: metadata.mimetype,
                        url: this.generateFileUrl(userId.toString(), fileId),
                        metadata: typeof metadata.metadata === 'string' ? JSON.parse(metadata.metadata) : metadata.metadata,
                        uploadedAt: metadata.uploaded_at,
                        lastModified: stats.mtime
                    });
                } catch (error) {
                    logger.warn(`Error reading metadata for file ${fileId}:`, error);
                    // Skip this file if metadata is corrupted
                    continue;
                }
            }
            
            // Determine next marker
            const nextMarker = paginatedEntries.length === limit ? 
                paginatedEntries[paginatedEntries.length - 1].name : undefined;
            
            return {
                files,
                nextMarker
            };
        } catch (error) {
            logger.error('Error listing files:', error);
            throw new InternalServerError(
                'RETRIEVAL_FAILED',
                'Failed to list files',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Retrieves a specific file by its ID
     * @param fileId - The ID of the file to retrieve
     * @param userId - The ID of the user requesting the file
     * @returns Promise containing file details
     * @throws {BadRequest} When file is not found or user is unauthorized
     * @throws {InternalServerError} When file retrieval fails
     */
    public async getFileById(fileId: string, userId: string | number): Promise<GetFileByIdResponse['data']> {
        try {
            const userDir = path.join(this.baseStoragePath, `users/${userId}`);
            const filePath = path.join(userDir, fileId);
            const metadataPath = `${filePath}.meta.json`;
            
            // Check if file exists
            try {
                await fs.access(filePath);
                await fs.access(metadataPath);
            } catch (error) {
                throw new BadRequest('FILE_NOT_FOUND', 'File not found', `File with ID ${fileId} not found`);
            }
            
            // Read metadata
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent) as AssetMetadata;
            
            // Verify user has permission
            if (metadata.user_id !== userId) {
                throw new BadRequest('UNAUTHORIZED', 'Unauthorized access', 'You do not have permission to access this file');
            }
            
            // Get file stats
            const stats = await fs.stat(filePath);
            
            return {
                fileId,
                fileName: metadata.original_name,
                fileSize: metadata.size,
                mimetype: metadata.mimetype,
                url: this.generateFileUrl(userId.toString(), fileId),
                metadata: typeof metadata.metadata === 'string' ? JSON.parse(metadata.metadata) : metadata.metadata,
                uploadedAt: metadata.uploaded_at,
                lastModified: stats.mtime
            };
        } catch (error) {
            logger.error('Error retrieving file:', error);
            throw error instanceof BadRequest ? error : new InternalServerError(
                'RETRIEVAL_FAILED',
                'Failed to retrieve file',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Deletes a file from filesystem storage
     * @param fileId - The ID of the file to delete
     * @param userId - The ID of the user requesting deletion
     * @throws {BadRequest} When file is not found or user is unauthorized
     * @throws {InternalServerError} When deletion fails
     */
    public async deleteFile(fileId: string, userId: string | number): Promise<void> {
        try {
            const userDir = path.join(this.baseStoragePath, `users/${userId}`);
            const filePath = path.join(userDir, fileId);
            const metadataPath = `${filePath}.meta.json`;
            
            // Check if file exists
            try {
                await fs.access(filePath);
                await fs.access(metadataPath);
            } catch (error) {
                throw new BadRequest('FILE_NOT_FOUND', 'File not found', `File with ID ${fileId} not found`);
            }
            
            // Read metadata to verify ownership
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent) as AssetMetadata;
            
            // Verify user has permission
            if (metadata.user_id !== userId) {
                throw new BadRequest('UNAUTHORIZED', 'Unauthorized access', 'You do not have permission to delete this file');
            }
            
            // Delete file and metadata
            await fs.unlink(filePath);
            await fs.unlink(metadataPath);
            
            logger.info(`File deleted successfully: ${fileId}`);
        } catch (error) {
            logger.error('Error deleting file:', error);
            throw error instanceof BadRequest ? error : new InternalServerError(
                'DELETION_FAILED',
                'Failed to delete file',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    /**
     * Reads a file from filesystem storage and returns its contents as a buffer
     * @param fileId - The ID of the file to read
     * @param userId - The ID of the user requesting the file
     * @returns Promise containing file buffer and metadata
     * @throws {BadRequest} When file is not found or user is unauthorized
     * @throws {InternalServerError} When file reading fails
     */
    public async readFile(fileId: string, userId: string | number): Promise<{ buffer: Buffer, metadata: AssetMetadata }> {
        try {
            const userDir = path.join(this.baseStoragePath, `users/${userId}`);
            const filePath = path.join(userDir, fileId);
            const metadataPath = `${filePath}.meta.json`;
            
            // Check if file exists
            try {
                await fs.access(filePath);
                await fs.access(metadataPath);
            } catch (error) {
                throw new BadRequest('FILE_NOT_FOUND', 'File not found', `File with ID ${fileId} not found`);
            }
            
            // Read metadata
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent) as AssetMetadata;
            
            // Verify user has permission
            if (metadata.user_id !== userId) {
                throw new BadRequest('UNAUTHORIZED', 'Unauthorized access', 'You do not have permission to access this file');
            }
            
            // Read file
            const buffer = await fs.readFile(filePath);
            
            return {
                buffer,
                metadata
            };
        } catch (error) {
            logger.error('Error reading file:', error);
            throw error instanceof BadRequest ? error : new InternalServerError(
                'READ_FAILED',
                'Failed to read file',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}