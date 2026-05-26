import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkLogEntryDto {
    @IsDateString()
    date!: string;

    @Type(() => Number)
    @IsInt()
    workTypeId!: number;

    @Type(() => Number)
    @IsInt()
    roadId!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    volume!: number;

    @IsString()
    executorName!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    topicId?: number;

    @IsOptional()
    workDone?: boolean;

    @IsOptional()
    workInProgress?: boolean;

    @IsOptional()
    workStopped?: boolean;

    @IsOptional()
    pinned?: boolean;
}

export class UpdateWorkLogEntryDto {
    @IsOptional()
    @IsDateString()
    date?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    workTypeId?: number;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    roadId?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    volume?: number;

    @IsOptional()
    @IsString()
    executorName?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    topicId?: number;

    @IsOptional()
    workDone?: boolean;

    @IsOptional()
    workInProgress?: boolean;

    @IsOptional()
    workStopped?: boolean;

    @IsOptional()
    pinned?: boolean;
}

export class WorkLogQueryDto {
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    roadId?: number;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    workTypeId?: number;

    @IsOptional()
    @IsString()
    sort?: 'date_desc' | 'date_asc';

    @IsOptional()
    @IsString()
    workTypeIds?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    volumeFrom?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    volumeTo?: number;

    @IsOptional()
    @IsString()
    roadIds?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(0)
    page?: number;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;

    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsOptional()
    @IsBoolean()
    pinned?: boolean;

    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsOptional()
    @IsBoolean()
    workDone?: boolean;

    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsOptional()
    @IsBoolean()
    workInProgress?: boolean;

    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsOptional()
    @IsBoolean()
    workStopped?: boolean;
}
