import { IsOptional, IsString } from 'class-validator';
import {
  TaskActivityLogAction,
  TaskActivityLogField,
} from 'prisma/generated/enums';

export class CreateActivityLogDto {
  @IsString()
  action: TaskActivityLogAction;

  @IsString()
  @IsOptional()
  field?: TaskActivityLogField;

  @IsString()
  @IsOptional()
  oldValue?: string | null;

  @IsString()
  @IsOptional()
  newValue?: string | null;
}
