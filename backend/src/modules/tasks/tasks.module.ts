import { Module } from '@nestjs/common';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { TaskActivityLogsController } from './task-activity-logs.controller';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ActivityLogsModule],
  controllers: [TasksController, TaskActivityLogsController],
  providers: [TasksService, WorkspaceRoleGuard],
})
export class TasksModule {}
