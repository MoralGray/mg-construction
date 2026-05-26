import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';

export function createAdapter(url: string) {
    const provider = process.env.DB_PROVIDER || 'sqlite';
    if (provider === 'postgresql') {
        return new PrismaPg({ connectionString: url });
    }
    return new PrismaBetterSqlite3({ url });
}
