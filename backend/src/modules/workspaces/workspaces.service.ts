import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityAction, ActivityEntityType } from 'prisma/generated/client';

import { PrismaService } from '@/database/prisma.service';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityLogInput } from '../activity-logs/types';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name: createWorkspaceDto.name },
      });

      await tx.membership.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: 'OWNER',
        },
      });

      return ws;
    });

    // ↓ Log OUTSIDE transaction — workspace đã commit, FK resolve được
    await this.activityLogs.log({
      workspaceId: workspace.id,
      actorUserId: userId,
      action: ActivityAction.CREATED,
      entityId: workspace.id,
      entityType: ActivityEntityType.WORKSPACE,
    });

    return workspace;
  }

  findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { memberships: { some: { userId } } },
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(
    id: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const old = await this.prisma.workspace.findUniqueOrThrow({
      where: { id },
    });

    const updated = await this.prisma.workspace.update({
      where: { id },
      data: updateWorkspaceDto,
    });

    const logData: ActivityLogInput[] = [];
    for (const key of Object.keys(updateWorkspaceDto) as Array<
      keyof UpdateWorkspaceDto
    >) {
      logData.push({
        entityType: ActivityEntityType.WORKSPACE,
        entityId: id,
        action: ActivityAction.UPDATED,
        field: key,
        oldValue: String(old[key as keyof typeof old]),
        newValue: String(updateWorkspaceDto[key]),
        workspaceId: id,
        actorUserId: userId,
        metadata: { workspaceName: old.name },
      });
    }

    await this.activityLogs.logBulk(logData);

    return updated;
  }

  remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.activityLog.deleteMany({ where: { workspaceId: id } });
      await tx.membership.deleteMany({ where: { workspaceId: id } });
      await tx.task.deleteMany({ where: { workspaceId: id } });
      return tx.workspace.delete({ where: { id } });
    });
  }

  async join(userId: string, id: string) {
    // Check workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check user is not already a member
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    if (membership) {
      throw new ForbiddenException(
        'You are already a member of this workspace',
      );
    }

    const newMembership = await this.prisma.membership.create({
      data: { workspaceId: id, userId, role: 'MEMBER' },
    });

    await this.activityLogs.log({
      entityType: ActivityEntityType.MEMBERSHIP,
      entityId: newMembership.id,
      action: ActivityAction.JOINED,
      workspaceId: id,
      actorUserId: userId,
      targetUserId: userId,
      metadata: { workspaceName: workspace.name },
    });

    return newMembership;
  }
}
