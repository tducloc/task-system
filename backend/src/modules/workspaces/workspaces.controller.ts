import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.workspacesService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(user.sub, id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.workspacesService.remove(user.sub, id);
  }

  @Post(':id/join')
  join(@CurrentUser() user, @Param('id') id: string) {
    return this.workspacesService.join(user.sub, id);
  }
}
