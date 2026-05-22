import { Injectable } from '@nestjs/common';

import { Prisma } from 'prisma/generated/client';

import { PrismaService } from '@/database/prisma.service';

import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { ActivityLogInput } from './types';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: ActivityLogInput) {
    return await this.prisma.activityLog.create({
      data: {
        ...data,
        metadata: data.metadata
          ? (data.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async logBulk(data: ActivityLogInput[]) {
    if (data.length === 0) {
      return { count: 0 };
    }

    return await this.prisma.activityLog.createMany({
      data: data.map((log) => ({
        ...log,
        metadata: log.metadata
          ? (log.metadata as Prisma.InputJsonValue)
          : undefined,
      })),
    });
  }

  async getAll(workspaceId: string, query: QueryActivityLogDto) {
    const { page, limit, entityType, entityId, actorUserId } = query;

    const where: Prisma.ActivityLogWhereInput = {
      workspaceId,
      entityType,
      entityId,
      actorUserId,
    };

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true } },
          targetUser: { select: { id: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
      data,
    };
  }
}
