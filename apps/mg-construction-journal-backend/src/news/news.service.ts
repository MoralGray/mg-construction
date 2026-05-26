import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PaginatedResponse } from '../work-log/work-log.entity.js';
import type { GetAllParams, NewsItem } from './news.entity.js';

@Injectable()
export class NewsService {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async getAll({
        page,
        limit,
        categories,
        date,
        sort,
        dateRange,
        sources,
    }: GetAllParams): Promise<PaginatedResponse<NewsItem>> {
        const where: Record<string, unknown> = {};

        if (categories && categories.length > 0) {
            where.category = { in: categories };
        }

        if (sources && sources.length > 0) {
            where.sourceId = { in: sources };
        }

        if (date) {
            where.date = date;
        }

        if (dateRange) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const startDate = new Date(today);

            switch (dateRange) {
                case 'day':
                    where.date = todayStr;
                    break;
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    where.date = {
                        gte: startDate.toISOString().split('T')[0],
                        lte: todayStr,
                    };
                    break;
                case 'month':
                    startDate.setDate(startDate.getDate() - 30);
                    where.date = {
                        gte: startDate.toISOString().split('T')[0],
                        lte: todayStr,
                    };
                    break;
                case 'year':
                    startDate.setDate(startDate.getDate() - 365);
                    where.date = {
                        gte: startDate.toISOString().split('T')[0],
                        lte: todayStr,
                    };
                    break;
            }
        }

        const orderBy: Record<string, string> = sort === 'popularity_desc' ? { popularity: 'desc' } : { date: 'desc' };

        const [total, rows] = await Promise.all([
            this.prisma.prisma.article.count({ where }),
            this.prisma.prisma.article.findMany({
                where,
                orderBy,
                skip: page * limit,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        const data: NewsItem[] = rows.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            content: a.content,
            category: a.category,
            popularity: a.popularity,
            date: a.date,
            source: a.sourceId,
            topicId: a.topicId ?? undefined,
        }));

        return { data, total, page, totalPages };
    }

    async getById(id: number): Promise<NewsItem | undefined> {
        const a = await this.prisma.prisma.article.findUnique({ where: { id } });
        if (!a) {
            return undefined;
        }
        return {
            id: a.id,
            title: a.title,
            description: a.description,
            content: a.content,
            category: a.category,
            popularity: a.popularity,
            date: a.date,
            source: a.sourceId,
            topicId: a.topicId ?? undefined,
        };
    }

    async getRelated(id: number): Promise<NewsItem[]> {
        const item = await this.getById(id);
        if (!item?.topicId) {
            return [];
        }
        const rows = await this.prisma.prisma.article.findMany({
            where: { topicId: item.topicId, id: { not: id } },
        });
        return rows.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            content: a.content,
            category: a.category,
            popularity: a.popularity,
            date: a.date,
            source: a.sourceId,
            topicId: a.topicId ?? undefined,
        }));
    }
}
