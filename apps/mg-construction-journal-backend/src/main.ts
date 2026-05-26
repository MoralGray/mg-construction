import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const PORT = Number(process.env.MG_CONSTRUCTION_JOURNAL_BACKEND_PORT);

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.listen(PORT);
    console.log(`[mg-construction-journal-backend] Server running on http://localhost:${PORT}`);
}

bootstrap();
