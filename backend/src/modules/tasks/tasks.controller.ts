import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: CreateTaskDto,
  ) {
    return this.tasksService.create({
      userId: user.sub,
      workspaceId,
      data,
    });
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  getAll(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryTaskDto,
  ) {
    return this.tasksService.getAll(workspaceId, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  get(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.tasksService.get(id, workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateTaskDto,
  ) {
    return this.tasksService.update({
      id,
      workspaceId,
      userId: user.sub,
      data,
    });
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  delete(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.delete({ id, userId: user.sub, workspaceId });
  }
}
