import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateWorkLogEntryDto, UpdateWorkLogEntryDto, WorkLogQueryDto } from './work-log.dto.js';
import type { PaginatedResponse, WorkLogEntryItem } from './work-log.entity.js';

@Injectable()
export class WorkLogService {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkLogEntryDto): Promise<WorkLogEntryItem> {
        const entry = await this.prisma.prisma.workLogEntry.create({
            data: {
                date: new Date(dto.date),
                workTypeId: dto.workTypeId,
                roadId: dto.roadId,
                volume: dto.volume,
                executorName: dto.executorName,
                description: dto.description ?? null,
                topicId: dto.topicId ?? null,
                workDone: dto.workDone ?? false,
                workInProgress: dto.workInProgress ?? false,
                workStopped: dto.workStopped ?? false,
                pinned: dto.pinned ?? false,
            },
            include: { workType: true, road: true },
        });
        return this.toItem(entry);
    }

    async findAll(query: WorkLogQueryDto): Promise<PaginatedResponse<WorkLogEntryItem>> {
        const page = Number(query.page ?? 0);
        const limit = Number(query.limit ?? 20);
        const where: Record<string, unknown> = {};

        if (query.dateFrom || query.dateTo) {
            const dateFilter: Record<string, Date> = {};
            if (query.dateFrom) {
                dateFilter.gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                dateFilter.lte = new Date(query.dateTo);
            }
            where.date = dateFilter;
        }

        if (query.roadId !== undefined) {
            where.roadId = query.roadId;
        }

        if (query.workTypeId !== undefined) {
            where.workTypeId = query.workTypeId;
        }

        if (query.workTypeIds) {
            const ids = query.workTypeIds
                .split(',')
                .map(Number)
                .filter((n) => !Number.isNaN(n));
            if (ids.length > 0) {
                where.workTypeId = { in: ids };
            }
        }

        if (query.search) {
            where.OR = [
                { executorName: { contains: query.search } },
                { workType: { name: { contains: query.search } } },
                { road: { name: { contains: query.search } } },
            ];
        }

        if (query.volumeFrom !== undefined || query.volumeTo !== undefined) {
            const volumeFilter: Record<string, number> = {};
            if (query.volumeFrom !== undefined) {
                volumeFilter.gte = Number(query.volumeFrom);
            }
            if (query.volumeTo !== undefined) {
                volumeFilter.lte = Number(query.volumeTo);
            }
            where.volume = volumeFilter;
        }

        if (query.roadIds) {
            const ids = query.roadIds
                .split(',')
                .map(Number)
                .filter((n) => !Number.isNaN(n));
            if (ids.length > 0) {
                where.roadId = { in: ids };
            }
        }

        if (query.pinned !== undefined) {
            where.pinned = query.pinned === true || (query.pinned as unknown as string) === 'true';
        }

        if (query.workDone !== undefined) {
            where.workDone = query.workDone === true || (query.workDone as unknown as string) === 'true';
        }

        if (query.workInProgress !== undefined) {
            where.workInProgress =
                query.workInProgress === true || (query.workInProgress as unknown as string) === 'true';
        }

        if (query.workStopped !== undefined) {
            where.workStopped = query.workStopped === true || (query.workStopped as unknown as string) === 'true';
        }

        const dateOrder = query.sort === 'date_asc' ? ('asc' as const) : ('desc' as const);
        const orderBy = [{ pinned: 'desc' as const }, { date: dateOrder }];

        const [total, rows] = await Promise.all([
            this.prisma.prisma.workLogEntry.count({ where }),
            this.prisma.prisma.workLogEntry.findMany({
                where,
                include: { workType: true, road: true },
                orderBy,
                skip: page * limit,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: rows.map((r) => this.toItem(r)),
            total,
            page,
            totalPages,
        };
    }

    async findOne(id: number): Promise<WorkLogEntryItem | undefined> {
        const entry = await this.prisma.prisma.workLogEntry.findUnique({
            where: { id },
            include: { workType: true, road: true },
        });
        if (!entry) {
            return undefined;
        }
        return this.toItem(entry);
    }

    async update(id: number, dto: UpdateWorkLogEntryDto): Promise<WorkLogEntryItem | undefined> {
        const existing = await this.prisma.prisma.workLogEntry.findUnique({ where: { id } });
        if (!existing) {
            return undefined;
        }

        const data: Record<string, unknown> = {};
        if (dto.date !== undefined) {
            data.date = new Date(dto.date);
        }
        if (dto.workTypeId !== undefined) {
            data.workTypeId = dto.workTypeId;
        }
        if (dto.roadId !== undefined) {
            data.roadId = dto.roadId;
        }
        if (dto.volume !== undefined) {
            data.volume = dto.volume;
        }
        if (dto.executorName !== undefined) {
            data.executorName = dto.executorName;
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
        }
        if (dto.topicId !== undefined) {
            data.topicId = dto.topicId;
        }
        if (dto.workDone !== undefined) {
            data.workDone = dto.workDone;
        }
        if (dto.workInProgress !== undefined) {
            data.workInProgress = dto.workInProgress;
        }
        if (dto.workStopped !== undefined) {
            data.workStopped = dto.workStopped;
        }
        if (dto.pinned !== undefined) {
            data.pinned = dto.pinned;
        }

        const entry = await this.prisma.prisma.workLogEntry.update({
            where: { id },
            data,
            include: { workType: true, road: true },
        });
        return this.toItem(entry);
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.prisma.prisma.workLogEntry.findUnique({ where: { id } });
        if (!existing) {
            return false;
        }
        await this.prisma.prisma.workLogEntry.delete({ where: { id } });
        return true;
    }

    async getRelated(id: number): Promise<WorkLogEntryItem[]> {
        const entry = await this.prisma.prisma.workLogEntry.findUnique({ where: { id } });
        if (!entry?.topicId) {
            return [];
        }
        const rows = await this.prisma.prisma.workLogEntry.findMany({
            where: { topicId: entry.topicId, id: { not: id } },
            include: { workType: true, road: true },
        });
        return rows.map((r) => this.toItem(r));
    }

    private toItem(entry: {
        id: number;
        date: Date;
        workTypeId: number;
        roadId: number;
        volume: number;
        executorName: string;
        description: string | null;
        topicId: number | null;
        workDone: boolean;
        workInProgress: boolean;
        workStopped: boolean;
        pinned: boolean;
        createdAt: Date;
        updatedAt: Date;
        workType: { name: string; unit: string };
        road: { name: string };
    }): WorkLogEntryItem {
        return {
            id: entry.id,
            date: entry.date.toISOString().split('T')[0],
            workTypeId: entry.workTypeId,
            workTypeName: entry.workType.name,
            workTypeUnit: entry.workType.unit,
            roadId: entry.roadId,
            roadName: entry.road.name,
            volume: entry.volume,
            executorName: entry.executorName,
            description: entry.description ?? undefined,
            topicId: entry.topicId ?? undefined,
            workDone: entry.workDone,
            workInProgress: entry.workInProgress,
            workStopped: entry.workStopped,
            pinned: entry.pinned,
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString(),
        };
    }
}
