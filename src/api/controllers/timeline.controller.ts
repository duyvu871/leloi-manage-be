import { Request, Response } from 'express';
import AsyncMiddleware from 'server/shared/utils/async-handler';
import Success from 'server/responses/success-response/success';
import { TimelineService } from 'services/timeline.service';
import {
    TimelineQuery,
    TimelineId,
    CreateTimelineItem,
    UpdateTimelineItem,
    ToggleVisibility,
    ReorderTimeline,
    BatchUpdateTimeline,
    ImportTimeline
} from 'validations/timeline.validation';

class TimelineController {
    private timelineService: TimelineService;

    constructor() {
        this.timelineService = new TimelineService();
    }

    listTimelineItems = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, {}, TimelineQuery>, res: Response) => {
            const query = req.query;
            const result = await this.timelineService.listTimelineItems(query);
            const response = new Success(result).message('Lấy danh sách mục thời gian thành công').toJson;
            return res.status(200).json(response);
        }
    );

    getTimelineItem = AsyncMiddleware.asyncHandler(
        async (req: Request<TimelineId>, res: Response) => {
            const { id } = req.params;
            const result = await this.timelineService.getTimelineItem(Number(id));
            const response = new Success(result).message('Lấy thông tin mục thời gian thành công').toJson;
            return res.status(200).json(response);
        }
    );

    createTimelineItem = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, CreateTimelineItem>, res: Response) => {
            const data = req.body;
            const result = await this.timelineService.createTimelineItem(data);
            const response = new Success(result).message('Tạo mục thời gian mới thành công').toJson;
            return res.status(201).json(response);
        }
    );

    updateTimelineItem = AsyncMiddleware.asyncHandler(
        async (req: Request<TimelineId, {}, UpdateTimelineItem>, res: Response) => {
            const { id } = req.params;
            const data = req.body;
            const result = await this.timelineService.updateTimelineItem(Number(id), data);
            const response = new Success(result).message('Cập nhật mục thời gian thành công').toJson;
            return res.status(200).json(response);
        }
    );

    deleteTimelineItem = AsyncMiddleware.asyncHandler(
        async (req: Request<TimelineId>, res: Response) => {
            const { id } = req.params;
            await this.timelineService.deleteTimelineItem(Number(id));
            const response = new Success(null).message('Xóa mục thời gian thành công').toJson;
            return res.status(200).json(response);
        }
    );

    toggleVisibility = AsyncMiddleware.asyncHandler(
        async (req: Request<TimelineId, {}, ToggleVisibility>, res: Response) => {
            const { id } = req.params;
            const { hidden } = req.body;
            const result = await this.timelineService.toggleVisibility(Number(id), hidden);
            const message = hidden ? 'Đã ẩn mục thời gian' : 'Đã hiện mục thời gian';
            const response = new Success(result).message(message).toJson;
            return res.status(200).json(response);
        }
    );

    importTimelineItems = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, ImportTimeline>, res: Response) => {
            const { items } = req.body;
            const result = await this.timelineService.importTimelineItems(items);
            const response = new Success(result)
                .message(`Đã nhập thành công ${result.count} mục thời gian`)
                .toJson;
            return res.status(201).json(response);
        }
    );

    exportTimelineItems = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, {}, TimelineQuery>, res: Response) => {
            const query = req.query;
            const result = await this.timelineService.exportTimelineItems(query);
            const response = new Success(result).message('Xuất dữ liệu thành công').toJson;
            return res.status(200).json(response);
        }
    );

    reorderTimelineItems = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, ReorderTimeline>, res: Response) => {
            const { itemIds } = req.body;
            const result = await this.timelineService.reorderTimelineItems(itemIds);
            const response = new Success(result).message('Sắp xếp lại các mục thời gian thành công').toJson;
            return res.status(200).json(response);
        }
    );

    batchUpdateTimelineItems = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, BatchUpdateTimeline>, res: Response) => {
            const { updates } = req.body;
            const result = await this.timelineService.batchUpdateTimelineItems(updates);
            const response = new Success(result)
                .message(`Đã cập nhật thành công ${result.count} mục thời gian`)
                .toJson;
            return res.status(200).json(response);
        }
    );

    getPublicTimeline = AsyncMiddleware.asyncHandler(
        async (req: Request<{}, {}, {}, TimelineQuery>, res: Response) => {
            const query = req.query;
            const result = await this.timelineService.getPublicTimeline(query);
            const response = new Success(result).message('Lấy danh sách thời gian biểu thành công').toJson;
            return res.status(200).json(response);
        }
    );
}

export default new TimelineController(); 