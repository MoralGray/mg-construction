import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../generated/prisma/client.js';
import { createAdapter } from './adapter.js';
import { ROADS, WORK_TYPES } from './seed-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCES = [
    {
        id: 'bbc',
        slug: 'bbc',
        name: 'BBC News',
        feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        bias: 'neutral',
        popularity: 3,
    },
    {
        id: 'aljazeera',
        slug: 'aljazeera',
        name: 'Al Jazeera',
        feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
        bias: 'neutral',
        popularity: 2,
    },
    {
        id: 'nytimes',
        slug: 'nytimes',
        name: 'New York Times',
        feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        bias: 'left',
        popularity: 3,
    },
    { id: 'rt', slug: 'rt', name: 'RT News', feedUrl: 'https://www.rt.com/rss/news/', bias: 'right', popularity: 1 },
    {
        id: 'scmp',
        slug: 'scmp',
        name: 'South China Morning Post',
        feedUrl: 'https://www.scmp.com/rss/3/feed',
        bias: 'neutral',
        popularity: 2,
    },
    {
        id: 'ndtv',
        slug: 'ndtv',
        name: 'NDTV',
        feedUrl: 'https://feeds.feedburner.com/ndtvnews-top-stories',
        bias: 'left',
        popularity: 2,
    },
    {
        id: 'timesofindia',
        slug: 'timesofindia',
        name: 'Times of India',
        feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
        bias: 'neutral',
        popularity: 2,
    },
];

const SOURCE_IDS = SOURCES.map((s) => s.id);

async function main() {
    const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    const adapter = createAdapter(url);
    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    console.log('Connected to database');

    // Clear existing data in order (respect FK constraints)
    await prisma.workLogEntry.deleteMany();
    await prisma.workType.deleteMany();
    await prisma.road.deleteMany();
    await prisma.article.deleteMany();
    await prisma.source.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleared existing data');

    // Seed sources
    for (const source of SOURCES) {
        await prisma.source.create({ data: source });
    }
    console.log(`Seeded ${SOURCES.length} sources`);

    // Seed articles from mock-news.json
    const raw = readFileSync(join(__dirname, 'mock-news.json'), 'utf-8');
    const parsed: {
        id: number;
        title: string;
        description: string;
        content: string;
        category: string;
        popularity: number;
        date: string;
        topicId?: number;
    }[] = JSON.parse(raw);

    for (const item of parsed) {
        await prisma.article.create({
            data: {
                id: item.id,
                title: item.title,
                description: item.description,
                content: item.content,
                category: item.category,
                popularity: item.popularity,
                date: item.date,
                topicId: item.topicId ?? null,
                sourceId: SOURCE_IDS[item.id % SOURCE_IDS.length],
            },
        });
    }
    console.log(`Seeded ${parsed.length} articles`);

    // Seed work types
    for (const wt of WORK_TYPES) {
        await prisma.workType.create({ data: wt });
    }
    console.log(`Seeded ${WORK_TYPES.length} work types`);

    // Seed roads
    for (const road of ROADS) {
        await prisma.road.create({ data: road });
    }
    console.log(`Seeded ${ROADS.length} roads`);

    await prisma.$disconnect();
    console.log('Seed complete');
}

main().catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
});
