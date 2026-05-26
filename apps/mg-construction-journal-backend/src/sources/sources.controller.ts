import { Controller, Get, Inject } from '@nestjs/common';
import { SourcesService } from './sources.service.js';

@Controller('api/sources')
export class SourcesController {
    constructor(@Inject(SourcesService) private readonly sourcesService: SourcesService) {}

    @Get()
    async getAll() {
        const data = await this.sourcesService.getAll();
        return { data };
    }
}
