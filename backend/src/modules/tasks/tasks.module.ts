import { Module } from '@nestjs/common';

import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ActivityLogsModule],
  controllers: [TasksController],
  providers: [TasksService, WorkspaceRoleGuard],
})
export class TasksModule {}
