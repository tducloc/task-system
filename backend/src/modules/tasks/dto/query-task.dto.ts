import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
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
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @Min(1)
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  limit: number;

  // Sort
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @IsEnum(OrderBy)
  @IsOptional()
  orderBy?: OrderBy;

  // Filter
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  statuses?: TaskStatus[];

  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignees?: string[];

  @MaxLength(255)
  @IsString()
  @IsOptional()
  search?: string;
}
