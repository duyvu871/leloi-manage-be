import { Router } from 'express';
import timelineController from 'controllers/timeline.controller';
import { authenticate } from 'middlewares/authenticate';
import { validateBody, validateParams, validateQuery } from 'middlewares/validate-request';
import {
    timelineQuerySchema,
    timelineIdSchema,
    createTimelineSchema,
    updateTimelineSchema,
    toggleVisibilitySchema,
    reorderTimelineSchema,
    batchUpdateSchema,
    importTimelineSchema
} from 'validations/timeline.validation';

const router = Router();

// TODO: Add public timeline route
// TODO: Add Admin wrapper for timeline route

/**
 * @route GET /api/v1/timeline/public
 * @desc Get public timeline items (non-hidden only)
 * @access Public
 */
router.get('/public',
    validateQuery(timelineQuerySchema),
    timelineController.getPublicTimeline
);

/**
 * @route GET /api/v1/timeline
 * @desc List all timeline items with filtering
 * @access Private
 */
router.get('/',
    authenticate,
    validateQuery(timelineQuerySchema),
    timelineController.listTimelineItems
);

/**
 * @route GET /api/v1/timeline/item/:id
 * @desc Get a specific timeline item by ID
 * @access Private
 */
router.get('/item/:id',
    authenticate,
    validateParams(timelineIdSchema),
    timelineController.getTimelineItem
);

/**
 * @route POST /api/v1/timeline/item
 * @desc Create a new timeline item
 * @access Private
 */
router.post('/item',
    authenticate,
    validateBody(createTimelineSchema),
    timelineController.createTimelineItem
);

/**
 * @route PATCH /api/v1/timeline/item/:id
 * @desc Update an existing timeline item
 * @access Private
 */
router.patch('/item/:id',
    authenticate,
    validateParams(timelineIdSchema),
    validateBody(updateTimelineSchema),
    timelineController.updateTimelineItem
);

/**
 * @route DELETE /api/v1/timeline/item/:id
 * @desc Delete a timeline item
 * @access Private
 */
router.delete('/item/:id',
    authenticate,
    validateParams(timelineIdSchema),
    timelineController.deleteTimelineItem
);

/**
 * @route PATCH /api/v1/timeline/item/:id/visibility
 * @desc Toggle visibility of a timeline item
 * @access Private
 */
router.patch('/item/:id/visibility',
    authenticate,
    validateParams(timelineIdSchema),
    validateBody(toggleVisibilitySchema),
    timelineController.toggleVisibility
);

/**
 * @route POST /api/v1/timeline/import
 * @desc Import multiple timeline items
 * @access Private
 */
router.post('/import',
    authenticate,
    validateBody(importTimelineSchema),
    timelineController.importTimelineItems
);

/**
 * @route GET /api/v1/timeline/export
 * @desc Export timeline items
 * @access Private
 */
router.get('/export',
    authenticate,
    validateQuery(timelineQuerySchema),
    timelineController.exportTimelineItems
);

/**
 * @route POST /api/v1/timeline/reorder
 * @desc Reorder timeline items
 * @access Private
 */
router.post('/reorder',
    authenticate,
    validateBody(reorderTimelineSchema),
    timelineController.reorderTimelineItems
);

/**
 * @route PATCH /api/v1/timeline/batch
 * @desc Batch update multiple timeline items
 * @access Private
 */
router.patch('/batch',
    authenticate,
    validateBody(batchUpdateSchema),
    timelineController.batchUpdateTimelineItems
);

export default router; 