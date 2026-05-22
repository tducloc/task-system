import { Module } from '@nestjs/common';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [ActivityLogsModule],
  controllers: [MembershipsController],
  providers: [MembershipsService, WorkspaceRoleGuard],
})
export class MembershipsModule {}
