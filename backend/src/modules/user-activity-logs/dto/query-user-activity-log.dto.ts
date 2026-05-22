import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { UserActivityAction } from 'prisma/generated/client';

export class QueryUserActivityLogDto {
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
  @IsEnum(UserActivityAction)
  action?: UserActivityAction;
}
