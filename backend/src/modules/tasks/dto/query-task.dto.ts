import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskStatus } from 'prisma/generated/enums';

import { OrderBy } from '@/types/sorts';

export enum SortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  STATUS = 'status',
}

export class QueryTaskDto {
  // Page
  @Min(1)
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page: number = 1;

  @Min(1)
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit: number = 20;

  // Sort
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @IsEnum(OrderBy)
  @IsOptional()
  orderBy?: OrderBy;

  // Filter
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : ((Array.isArray(value) ? value : [value]) as TaskStatus[]),
  )
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  statuses?: TaskStatus[];

  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : ((Array.isArray(value) ? value : [value]) as string[]),
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignees?: string[];

  @MaxLength(255)
  @IsString()
  @IsOptional()
  search?: string;
}
