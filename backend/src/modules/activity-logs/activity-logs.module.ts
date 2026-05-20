import { Module } from '@nestjs/common';

import { WorkspaceRoleGuard } from '@/modules/auth/guards/workspace-role.guard';

import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';

@Module({
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, WorkspaceRoleGuard],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
