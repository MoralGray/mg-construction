import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface WorkTypeItem {
    id: number;
    slug: string;
    name: string;
    unit: string;
}

@Injectable()
export class WorkTypeService {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    async findAll(): Promise<WorkTypeItem[]> {
        return this.prisma.prisma.workType.findMany({ orderBy: { id: 'asc' } });
    }
}
