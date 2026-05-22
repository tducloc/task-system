import { Module } from '@nestjs/common';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [ActivityLogsModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceRoleGuard],
})
export class WorkspacesModule {}
