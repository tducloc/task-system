import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'prisma/generated/client';

import { PrismaService } from '@/database/prisma.service';
import { checkIsPrismaError } from '@/utils/errors';

import { ActivityLogInput } from './types';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: ActivityLogInput) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          ...data,
          metadata: data.metadata
            ? (data.metadata as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch (e) {
      if (checkIsPrismaError(e) && e.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
    }
  }

  async logBulk({
    userId,
    taskId,
    workspaceId,
    data,
  }: {
    userId: string;
    taskId: string;
    workspaceId: string;
    data: CreateActivityLogDto[];
  }) {
    try {
      return await this.prisma.taskActivityLog.createMany({
        data: data.map((log) => ({
          userId,
          taskId,
          workspaceId,
          ...log,
        })),
      });
    } catch (e) {
      if (checkIsPrismaError(e) && e.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
    }
  }

  async getAll({
    workspaceId,
    taskId,
  }: {
    workspaceId: string;
    taskId: string;
  }) {
    return await this.prisma.activityLog.findMany({
      where: {
        taskId,
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
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
  }
}
