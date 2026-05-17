import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: { name: createWorkspaceDto.name },
      });

      // Add current user to become owner
      await tx.membership.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'OWNER',
        },
      });

      return workspace;
    });
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

  update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id },
      data: updateWorkspaceDto,
    });
  }

  remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // Delete all membership
      await tx.membership.deleteMany({
        where: { workspaceId: id },
      });

      // Delete all tasks
      await tx.task.deleteMany({
        where: { workspaceId: id },
      });

      // Delete workspace
      return tx.workspace.delete({
        where: { id },
      });
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

    return this.prisma.membership.create({
      data: { workspaceId: id, userId, role: 'MEMBER' },
    });
  }
}
