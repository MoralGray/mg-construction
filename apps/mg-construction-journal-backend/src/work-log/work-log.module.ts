import { Module } from '@nestjs/common';
import { WorkLogController } from './work-log.controller.js';
import { WorkLogService } from './work-log.service.js';

@Module({
    controllers: [WorkLogController],
    providers: [WorkLogService],
    exports: [WorkLogService],
})
export class WorkLogModule {}
