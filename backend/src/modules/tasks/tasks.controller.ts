import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  create(@Param('workspaceId') workspaceId, @Body() data: CreateTaskDto) {
    return this.tasksService.create(workspaceId, data);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  getAll(@Param('workspaceId') workspaceId) {
    return this.tasksService.getAll(workspaceId);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  get(@Param('id') id) {
    return this.tasksService.get(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  update(@Param('id') id, @Body() data: UpdateTaskDto) {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  delete(@Param('id') id) {
    return this.tasksService.delete(id);
  }
}
