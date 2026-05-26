import { Module } from '@nestjs/common';
import { RoadController } from './road.controller.js';
import { RoadService } from './road.service.js';

@Module({
    controllers: [RoadController],
    providers: [RoadService],
    exports: [RoadService],
})
export class RoadModule {}
