import { PrismaClient, Prisma } from '@prisma/client';
import prisma from 'repository/prisma';
import { CreateFeedbackData, FeedbackQueryParams, UpdateFeedbackStatusData } from 'validations/feedback.validation';
import { FeedbackDto, FeedbackListResponseDto } from 'common/dto/feedback.dto';
import { FeedbackStatus } from 'common/enums/feedback.enum';
import NotFound from 'responses/client-errors/not-found';
import { PrismaPaginationOptions } from 'server/shared/helpers/pagination-parse';

export class FeedbackService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    private transformToDto(feedback: any): FeedbackDto {
        return {
            id: feedback.id,
            type: feedback.type,
            content: feedback.content,
            needSupport: feedback.needSupport,
            needCallback: feedback.needCallback,
            isUrgent: feedback.isUrgent,
            status: feedback.status,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt,
            userId: feedback.userId
        };
    }

    async createFeedback(userId: number, data: CreateFeedbackData): Promise<FeedbackDto> {
        const feedback = await this.prisma.feedback.create({
            data: {
                ...data,
                userId,
                status: FeedbackStatus.PENDING
            }
        });

        return this.transformToDto(feedback);
    }

    async getFeedbackList(query: PrismaPaginationOptions<'feedback'>): Promise<
    { 
        data: Prisma.FeedbackGetPayload<{ 
            include: { 
                user: { 
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true
                    }
                }
            }
        }>[],
        total: number
    }> {
        const [items, total] = await Promise.all([
            this.prisma.feedback.findMany({
                ...query,
                where: query.where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true
                        }
                    }
                }
            }),
            this.prisma.feedback.count({ where: query.where })
        ]);

        return {
           data: items,
           total
        };
    }

    async updateFeedbackStatus(id: number, data: UpdateFeedbackStatusData): Promise<FeedbackDto> {
        try {
            const feedback = await this.prisma.feedback.update({
                where: { id },
                data: { status: data.status }
            });

            return this.transformToDto(feedback);
        } catch (error) {
            throw new NotFound(
                'FEEDBACK_NOT_FOUND',
                'Feedback not found',
                'Không tìm thấy phản hồi'
            );
        }
    }
}

export default new FeedbackService(); 