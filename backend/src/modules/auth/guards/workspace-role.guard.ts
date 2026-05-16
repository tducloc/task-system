import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';

import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    // Get roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required => allow all
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get membership data
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const workspaceId = request.params?.workspaceId || request.params?.id;

    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    // If not have memebership => User does not join the workspace yet
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // If user role is not in required roles => User does not have permission
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    request.membership = membership;
    return true;
  }
}
