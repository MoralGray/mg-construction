import { Controller, Get, Inject, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { NewsService } from './news.service.js';

@Controller('api/news')
export class NewsController {
    constructor(@Inject(NewsService) private readonly newsService: NewsService) {}

    @Get()
    async getAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('categories') categories?: string,
        @Query('date') date?: string,
        @Query('sort') sort?: string,
        @Query('dateRange') dateRange?: string,
        @Query('sources') sources?: string
    ) {
        const p = page ?? 0;
        const l = limit ?? 6;
        const cats = categories
            ? categories
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean)
            : undefined;
        const srcs = sources
            ? sources
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : undefined;

        const validSort = sort === 'date_desc' || sort === 'popularity_desc' ? sort : undefined;
        const validDateRange =
            dateRange === 'day' || dateRange === 'week' || dateRange === 'month' || dateRange === 'year'
                ? dateRange
                : undefined;

        return this.newsService.getAll({
            page: p,
            limit: l,
            categories: cats,
            date: date || undefined,
            sort: validSort,
            dateRange: validDateRange,
            sources: srcs,
        });
    }

    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
        const item = await this.newsService.getById(id);
        if (!item) {
            throw new NotFoundException(`News item with id ${id} not found`);
        }
        return item;
    }

    @Get(':id/related')
    async getRelated(@Param('id', ParseIntPipe) id: number) {
        const item = await this.newsService.getById(id);
        if (!item) {
            throw new NotFoundException(`News item with id ${id} not found`);
        }
        return this.newsService.getRelated(id);
    }
}
