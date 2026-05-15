import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('workspaces/:workspaceId/memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.membershipsService.findAll(currentUser.sub, workspaceId);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser,
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update({
      currentUserId: currentUser.sub,
      workspaceId,
      membershipId: id,
      data: updateMembershipDto,
    });
  }

  @Delete(':id')
  remove(
    @CurrentUser() currentUser,
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.membershipsService.remove({
      currentUserId: currentUser.sub,
      workspaceId,
      memebershipId: id,
    });
  }
}
