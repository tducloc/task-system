import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import { WorkspaceRoles } from '@/modules/auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '@/modules/auth/guards/workspace-role.guard';

import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@Controller('workspaces/:workspaceId/activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  get(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryActivityLogDto,
  ) {
    return this.service.getAll(workspaceId, query);
  }
}
