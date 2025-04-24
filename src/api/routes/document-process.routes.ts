import { Router } from 'express';
import { DocumentProcessController } from 'controllers/document-process.controller';
import { upload, validateFileUpload } from 'middlewares/file-validation.middleware';
import { authenticate } from 'middlewares/authenticate';
import { validateBody } from 'middlewares/validate-request';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { FileType } from 'server/common/enums/file-types.enum';

const documentProcessRouter = Router();
const documentProcessController = new DocumentProcessController();

/**
 * @swagger
 * /registration/document-upload:
 *   post:
 *     summary: Upload and process a document
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *               - applicationId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 description: The type of document being uploaded
 *               applicationId:
 *                 type: string
 *                 description: The ID of the application this document belongs to
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the document
 *     responses:
 *       201:
 *         description: Document uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         type:
 *                           type: string
 *                         filename:
 *                           type: string
 *                         url:
 *                           type: string
 *                         uploadedAt:
 *                           type: string
 *                           format: date-time
 *                     extractedData:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fields:
 *                           type: object
 *                         isVerified:
 *                           type: boolean
 *       400:
 *         description: Invalid file, document type, or application ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       413:
 *         description: File size exceeds the maximum limit
 */
documentProcessRouter.post(
    '/document-upload',
    uploadMiddleware(
		{
			fileTypes: [FileType.PDF],
			maxFileSize: 1024 * 1024 * 50, // 10MB file size limit
		}).single('image'),
    authenticate,
    documentProcessController.uploadDocument
);

/**
 * @swagger
 * /registration/application/{applicationId}/documents:
 *   get:
 *     summary: Get all documents for a specific application
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application to get documents for
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           filename:
 *                             type: string
 *                           url:
 *                             type: string
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid application ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
documentProcessRouter.get(
    '/application/:applicationId/documents',
    authenticate,
    documentProcessController.getApplicationDocuments
);

/**
 * @swagger
 * /registration/document-upload/{documentId}/extracted-data:
 *   get:
 *     summary: Get extracted data for a specific document
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document to get extracted data for
 *     responses:
 *       200:
 *         description: Extracted data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedData:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fields:
 *                           type: object
 *                         isVerified:
 *                           type: boolean
 *       400:
 *         description: Invalid document ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
documentProcessRouter.get(
    '/document-upload/:documentId/extracted-data',
    authenticate,
    documentProcessController.getExtractedData
);

/**
 * @swagger
 * /registration/document-upload/extracted-data/{extractedDataId}:
 *   patch:
 *     summary: Verify extracted data
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: extractedDataId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the extracted data to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Extracted data verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedData:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fields:
 *                           type: object
 *                         isVerified:
 *                           type: boolean
 *       400:
 *         description: Invalid extracted data ID or verification status
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
documentProcessRouter.patch(
    '/document-upload/extracted-data/:extractedDataId',
    authenticate,
    documentProcessController.verifyExtractedData
);

export default documentProcessRouter;