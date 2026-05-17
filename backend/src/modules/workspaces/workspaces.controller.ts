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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceRoles } from '../auth/decorators/workspace-roles.decorator';
import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.sub, createWorkspaceDto);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.workspacesService.findAll(user.sub);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.MEMBER, Role.OWNER)
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.OWNER)
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(Role.OWNER)
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(id);
  }

  @Post(':id/join')
  join(@CurrentUser() user, @Param('id') id: string) {
    return this.workspacesService.join(user.sub, id);
  }
}
