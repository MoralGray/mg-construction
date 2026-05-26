import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { NewsController } from './news/news.controller.js';
import { NewsService } from './news/news.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RoadModule } from './road/road.module.js';
import { SourcesController } from './sources/sources.controller.js';
import { SourcesService } from './sources/sources.service.js';
import { WorkLogModule } from './work-log/work-log.module.js';
import { WorkTypeModule } from './work-type/work-type.module.js';

@Module({
    imports: [PrismaModule, AuthModule, WorkLogModule, WorkTypeModule, RoadModule],
    controllers: [AppController, NewsController, SourcesController],
    providers: [NewsService, SourcesService],
})
export class AppModule {}
