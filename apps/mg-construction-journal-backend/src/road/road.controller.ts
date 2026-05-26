import { Controller, Get, Inject, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { RoadService } from './road.service.js';

@Controller('api/roads')
export class RoadController {
    constructor(@Inject(RoadService) private readonly roadService: RoadService) {}

    @Get()
    async findAll() {
        const data = await this.roadService.findAll();
        return { data };
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const item = await this.roadService.findOne(id);
        if (!item) {
            throw new NotFoundException(`Road with id ${id} not found`);
        }
        return item;
    }

    @Get(':id/stats')
    async getStats(@Param('id', ParseIntPipe) id: number) {
        return this.roadService.getStats(id);
    }
}
