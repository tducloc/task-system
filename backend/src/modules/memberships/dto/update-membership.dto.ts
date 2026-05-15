import { IsEnum } from 'class-validator';
import { Role } from 'prisma/generated/enums';

export class UpdateMembershipDto {
  @IsEnum(Role)
  role: Role;
}
