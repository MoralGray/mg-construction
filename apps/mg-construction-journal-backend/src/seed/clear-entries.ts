import 'dotenv/config';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import { PrismaClient } from '../generated/prisma/client.js';
import { createAdapter } from './adapter.js';

async function main() {
    const rl = readline.createInterface({ input, output });

    const answer = await rl.question(
        'Are you sure you want to delete ALL work log entries? This cannot be undone. (yes/no): '
    );
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        process.exit(0);
    }

    const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    const adapter = createAdapter(url);
    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    console.log('Connected to database');

    const result = await prisma.workLogEntry.deleteMany();
    console.log(`Deleted ${result.count} work log entries`);

    const roadCount = await prisma.road.count();
    const workTypeCount = await prisma.workType.count();
    console.log(`Roads remaining: ${roadCount}`);
    console.log(`Work types remaining: ${workTypeCount}`);

    await prisma.$disconnect();
    console.log('Clear complete');
}

main().catch((e) => {
    console.error('Clear failed:', e);
    process.exit(1);
});
