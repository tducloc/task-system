import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';
import { checkIsPrismaError } from '@/utils/errors';

import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log({
    userId,
    taskId,
    workspaceId,
    data,
  }: {
    userId: string;
    taskId: string;
    workspaceId: string;
    data: CreateActivityLogDto;
  }) {
    try {
      return await this.prisma.taskActivityLog.create({
        data: {
          userId,
          taskId,
          workspaceId,
          ...data,
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
    return await this.prisma.taskActivityLog.findMany({
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
