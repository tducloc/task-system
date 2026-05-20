import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { WorkspaceRoles } from '@/modules/auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/auth/guards/workspace-role.guard';

import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Controller('workspaces/:workspaceId/tasks/:taskId/activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  //   @Post()
  //   @UseGuards(WorkspaceRoleGuard)
  //   @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  //   create(
  //     @Param('workspaceId') workspaceId: string,
  //     @Param('taskId') id: string,
  //     @CurrentUser() user: any,
  //     @Body() data: CreateActivityLogDto,
  //   ) {
  //     return this.service.log({
  //       userId: user.sub,
  //       taskId,
  //       workspaceId,
  //       data,
  //     });
  //   }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  get(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.service.getAll({
      workspaceId,
      taskId,
    });
  }
}
