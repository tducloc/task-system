import { Injectable } from '@nestjs/common';

import { Prisma } from 'prisma/generated/client';

import { PrismaService } from '@/database/prisma.service';

import { QueryUserActivityLogDto } from './dto/query-user-activity-log.dto';
import { UserActivityLogInput } from './types';

@Injectable()
export class UserActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: UserActivityLogInput) {
    return await this.prisma.userActivityLog.create({
      data: {
        ...data,
        metadata: data.metadata
          ? (data.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async getAll(userId: string, query: QueryUserActivityLogDto) {
    const { page, limit, action } = query;

    const where: Prisma.UserActivityLogWhereInput = { userId, action };

    const [data, total] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userActivityLog.count({ where }),
    ]);

    return {
      meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
      data,
    };
  }

  async logBulk(data: UserActivityLogInput[]) {
    if (data.length === 0) {
      return { count: 0 };
    }

    const formattedData = data.map((item) => ({
      ...item,
      metadata: item.metadata
        ? (item.metadata as Prisma.InputJsonValue)
        : undefined,
    }));

    return await this.prisma.userActivityLog.createMany({
      data: formattedData,
    });
  }
}
