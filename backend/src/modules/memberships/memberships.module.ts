import { Module } from '@nestjs/common';

import { WorkspaceRoleGuard } from '../auth/guards/workspace-role.guard';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService, WorkspaceRoleGuard],
})
export class MembershipsModule {}
