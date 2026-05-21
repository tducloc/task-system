import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from 'prisma/generated/client';
import {
  ActivityAction,
  ActivityEntityType,
  Role,
} from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private async getMembership(tx: Prisma.TransactionClient, id: string) {
    const membership = await tx.membership.findUnique({
      where: { id },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  private async checkIsOwner(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    userId: string,
  ) {
    const membership = await tx.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only owner can perform this action');
    }

    return;
  }

  private async ensureTargetNotLastOwner(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    role: Role,
  ) {
    if (role === Role.OWNER) {
      const ownerCount = await tx.membership.count({
        where: { workspaceId, role: Role.OWNER },
      });

      if (ownerCount === 1) {
        throw new ForbiddenException('Cannot remove or demote last owner');
      }

      return;
    }
  }

  async findAll(workspaceId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return memberships;
  }

  async update({
    userId,
    workspaceId,
    membershipId,
    data,
  }: {
    userId: string;
    workspaceId: string;
    membershipId: string;
    data: UpdateMembershipDto;
  }) {
    const old = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!old) {
      throw new NotFoundException('Membership not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const targetMembership = await this.getMembership(tx, membershipId);

      if (data.role === Role.MEMBER) {
        await this.ensureTargetNotLastOwner(
          tx,
          workspaceId,
          targetMembership.role,
        );
      }

      return await tx.membership.update({
        where: { id: membershipId },
        data: { role: data.role },
      });
    });

    await this.activityLogs.log({
      entityId: membershipId,
      entityType: ActivityEntityType.MEMBERSHIP,
      action: ActivityAction.UPDATED,
      workspaceId,
      actorUserId: userId,
      targetUserId: updated.userId,
      field: 'role',
      oldValue: old.role,
      newValue: data.role,
    });

    return updated;
  }

  async remove({
    currentUserId,
    workspaceId,
    membershipId,
  }: {
    currentUserId: string;
    workspaceId: string;
    membershipId: string;
  }) {
    const removed = await this.prisma.$transaction(async (tx) => {
      const targetMembership = await this.getMembership(tx, membershipId);
      const isSelfLeave = targetMembership.userId === currentUserId;

      // Delete yourself
      if (isSelfLeave) {
        await this.ensureTargetNotLastOwner(
          tx,
          workspaceId,
          targetMembership.role,
        );
      }
      // Delete other users
      else {
        await this.checkIsOwner(tx, workspaceId, currentUserId);
      }

      const deleted = await tx.membership.delete({
        where: { id: membershipId },
      });

      return { deleted, isSelfLeave };
    });

    await this.activityLogs.log({
      entityId: membershipId,
      entityType: ActivityEntityType.MEMBERSHIP,
      action: removed.isSelfLeave ? ActivityAction.LEFT : ActivityAction.KICKED,
      workspaceId,
      actorUserId: currentUserId,
      targetUserId: removed.deleted.userId,
    });

    return removed.deleted;
  }
}
