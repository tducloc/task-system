import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { ActivityEntityType, Role } from 'prisma/generated/enums';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { QueryActivityLogDto } from '../activity-logs/dto/query-activity-log.dto';
import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';

@Controller('workspaces/:workspaceId/tasks/:taskId/activity-logs')
@UseGuards(WorkspaceRoleGuard)
@WorkspaceRoles(Role.MEMBER, Role.OWNER)
export class TaskActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  getAll(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Query() query: QueryActivityLogDto,
  ) {
    return this.service.getAll(workspaceId, {
      ...query,
      entityType: ActivityEntityType.TASK,
      entityId: taskId,
    });
  }
}
