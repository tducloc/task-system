import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Role } from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';

import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMembership(tx: any, id: string) {
    const membership = await tx.membership.findUnique({
      where: { id },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  private async checkIsOwner(tx: any, workspaceId: string, userId: string) {
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
    tx: any,
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
    workspaceId,
    membershipId,
    data,
  }: {
    workspaceId: string;
    membershipId: string;
    data: UpdateMembershipDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
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
  }

  remove({
    currentUserId,
    workspaceId,
    membershipId,
  }: {
    currentUserId: string;
    workspaceId: string;
    membershipId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const targetMembership = await this.getMembership(tx, membershipId);

      // Delete yourself
      if (targetMembership.userId === currentUserId) {
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

      return await tx.membership.delete({
        where: { id: membershipId },
      });
    });
  }
}
