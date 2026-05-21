import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('workspaces/:workspaceId/memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.OWNER, Role.MEMBER)
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.membershipsService.findAll(workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.OWNER)
  update(
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membershipsService.update({
      userId: user.sub,
      workspaceId,
      membershipId: id,
      data: updateMembershipDto,
    });
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.OWNER, Role.MEMBER)
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.membershipsService.remove({
      currentUserId: currentUser.sub,
      workspaceId,
      membershipId: id,
    });
  }
}
