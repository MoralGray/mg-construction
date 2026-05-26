import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import type { CreateWorkLogEntryDto, UpdateWorkLogEntryDto, WorkLogQueryDto } from './work-log.dto.js';
import { WorkLogService } from './work-log.service.js';

@Controller('api/work-log')
export class WorkLogController {
    constructor(@Inject(WorkLogService) private readonly workLogService: WorkLogService) {}

    @Post()
    async create(@Body() dto: CreateWorkLogEntryDto) {
        return this.workLogService.create(dto);
    }

    @Get()
    @Header('Cache-Control', 'no-store')
    async findAll(@Query() query: WorkLogQueryDto) {
        return this.workLogService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const item = await this.workLogService.findOne(id);
        if (!item) {
            throw new NotFoundException(`Work log entry with id ${id} not found`);
        }
        return item;
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkLogEntryDto) {
        const item = await this.workLogService.update(id, dto);
        if (!item) {
            throw new NotFoundException(`Work log entry with id ${id} not found`);
        }
        return item;
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        const deleted = await this.workLogService.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Work log entry with id ${id} not found`);
        }
        return { deleted: true };
    }

    @Get(':id/related')
    async getRelated(@Param('id', ParseIntPipe) id: number) {
        const item = await this.workLogService.findOne(id);
        if (!item) {
            throw new NotFoundException(`Work log entry with id ${id} not found`);
        }
        return this.workLogService.getRelated(id);
    }
}
