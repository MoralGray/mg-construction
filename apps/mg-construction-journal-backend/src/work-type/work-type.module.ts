import { Module } from '@nestjs/common';
import { WorkTypeController } from './work-type.controller.js';
import { WorkTypeService } from './work-type.service.js';

@Module({
    controllers: [WorkTypeController],
    providers: [WorkTypeService],
    exports: [WorkTypeService],
})
export class WorkTypeModule {}
