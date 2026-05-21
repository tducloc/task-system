import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ActivityEntityType } from 'prisma/generated/enums';

export class QueryActivityLogDto {
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

  @IsOptional()
  @IsEnum(ActivityEntityType)
  entityType?: ActivityEntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;
}
