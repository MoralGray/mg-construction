import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Source } from './sources.entity.js';

@Injectable()
export class SourcesService {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async getAll(): Promise<Source[]> {
        const sources = await this.prisma.prisma.source.findMany({
            orderBy: { popularity: 'desc' },
        });
        return sources.map((s) => ({
            id: s.id,
            name: s.name,
            feedUrl: s.feedUrl,
            logoUrl: s.logoUrl ?? undefined,
            category: s.bias as 'left' | 'right' | 'neutral',
            popularity: s.popularity,
        }));
    }
}
