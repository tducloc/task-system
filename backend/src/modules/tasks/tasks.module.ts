import { Module } from '@nestjs/common';

import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, WorkspaceRoleGuard],
})
export class TasksModule {}
