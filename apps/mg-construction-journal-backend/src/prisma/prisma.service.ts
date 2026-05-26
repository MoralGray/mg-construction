import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    public prisma: PrismaClient;

    constructor() {
        const provider = process.env.DB_PROVIDER || 'sqlite';
        const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';

        let adapter: PrismaBetterSqlite3 | PrismaPg;

        if (provider === 'postgresql') {
            adapter = new PrismaPg({ connectionString: url });
        } else {
            adapter = new PrismaBetterSqlite3({ url });
        }

        this.prisma = new PrismaClient({ adapter });
    }

    async onModuleInit() {
        await this.prisma.$connect();
    }

    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }
}
