import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface RoadItem {
    id: number;
    name: string;
    slug: string;
    roadType: string;
    description?: string;
}

export interface RoadStats {
    entryCount: number;
    statusDistribution: {
        workDone: number;
        workInProgress: number;
        workStopped: number;
    };
    totalVolume: number;
}

@Injectable()
export class RoadService {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async findAll(): Promise<RoadItem[]> {
        const roads = await this.prisma.prisma.road.findMany({ orderBy: { name: 'asc' } });
        return roads.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            roadType: r.roadType,
            description: r.description ?? undefined,
        }));
    }

    async findOne(id: number): Promise<RoadItem | undefined> {
        const r = await this.prisma.prisma.road.findUnique({ where: { id } });
        if (!r) {
            return undefined;
        }
        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            roadType: r.roadType,
            description: r.description ?? undefined,
        };
    }

    async getStats(id: number): Promise<RoadStats> {
        const road = await this.prisma.prisma.road.findUnique({ where: { id } });
        if (!road) {
            throw new NotFoundException(`Road with id ${id} not found`);
        }

        const entries = await this.prisma.prisma.workLogEntry.findMany({ where: { roadId: id } });

        const entryCount = entries.length;
        const workDone = entries.filter((e) => e.workDone).length;
        const workInProgress = entries.filter((e) => e.workInProgress).length;
        const workStopped = entries.filter((e) => e.workStopped).length;
        const totalVolume = entries.reduce((sum, e) => sum + e.volume, 0);

        return {
            entryCount,
            statusDistribution: { workDone, workInProgress, workStopped },
            totalVolume,
        };
    }
}
