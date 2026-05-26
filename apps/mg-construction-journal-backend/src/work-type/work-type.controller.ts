import { Controller, Get, Inject } from '@nestjs/common';
import { WorkTypeService } from './work-type.service.js';

@Controller('api/work-types')
export class WorkTypeController {
    constructor(@Inject(WorkTypeService) private readonly workTypeService: WorkTypeService) {}

    @Get()
    async findAll() {
        const data = await this.workTypeService.findAll();
        return { data };
    }
}
