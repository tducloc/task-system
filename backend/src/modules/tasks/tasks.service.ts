import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'prisma/generated/client';
import {
  ActivityAction,
  ActivityEntityType,
  // TaskActivityLogAction,
  // TaskActivityLogField,
  TaskStatus,
} from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';
import { OrderBy } from '@/types/sorts';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityLogInput } from '../activity-logs/types';
// import { ActivityLogsService } from './activity-logs/activity-logs.service';
// import { CreateActivityLogDto } from './activity-logs/dto/create-activity-log.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto, SortBy } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create({
    userId,
    workspaceId,
    data,
  }: {
    userId: string;
    workspaceId: string;
    data: CreateTaskDto;
  }) {
    const newTask = await this.prisma.$transaction(async (tx) => {
      // Create task
      const { assignees = [], ...taskData } = data;
      const task = await tx.task.create({
        data: {
          ...taskData,
          status: taskData.status || TaskStatus.TODO,
          workspaceId,
        },
      });

      // Create task assignee
      const assigneesData = assignees.map((id) => {
        return {
          taskId: task.id,
          userId: id,
        };
      });

      if (assigneesData.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneesData,
        });
      }

      return task;
    });

    await this.activityLogs.log({
      entityId: newTask.id,
      entityType: ActivityEntityType.TASK,
      action: ActivityAction.CREATED,
      actorUserId: userId,
      workspaceId,
    });

    return newTask;
  }

  async getAll(workspaceId: string, query: QueryTaskDto) {
    const {
      page,
      limit,
      sortBy = SortBy.CREATED_AT,
      orderBy = OrderBy.ASC,
      assignees,
      search,
      statuses,
    } = query;

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      workspaceId,
      assignees: assignees
        ? { some: { userId: { in: assignees } } }
        : undefined,
      title: search ? { contains: search, mode: 'insensitive' } : undefined,
      status: statuses ? { in: statuses } : undefined,
    };

    const data = await this.prisma.task.findMany({
      where,
      orderBy: { [sortBy]: orderBy },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },

      skip: (query.page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.task.count({
      where,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data,
    };
  }

  async get(id: string, workspaceId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update({
    id,
    userId,
    workspaceId,
    data,
  }: {
    id: string;
    userId: string;
    workspaceId: string;
    data: UpdateTaskDto;
  }) {
    const oldTask = await this.prisma.task.findUnique({
      where: {
        id,
        workspaceId,
        deletedAt: null,
      },
      include: {
        assignees: {
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

    if (!oldTask) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const { assignees, ...taskData } = data;

      const updatedTask = await tx.task.update({
        where: { id, workspaceId },
        data: taskData,
      });

      if (assignees) {
        // Delete all old assignee record
        await tx.taskAssignee.deleteMany({
          where: { taskId: id },
        });

        const assigneesData = assignees.map((userId) => {
          return {
            taskId: id,
            userId,
          };
        });

        if (assigneesData.length > 0) {
          // Create new one
          await tx.taskAssignee.createMany({
            data: assigneesData,
          });
        }
      }

      return updatedTask;
    });

    const logData: ActivityLogInput[] = [];

    const keys = Object.keys(data).filter(
      (key) => !['assignees'].includes(key),
    );

    const common = {
      entityId: oldTask.id,
      entityType: ActivityEntityType.TASK,
      actorUserId: userId,
      workspaceId,
    };

    for (const key of keys) {
      logData.push({
        ...common,
        action: ActivityAction.UPDATED,
        field: key,
        oldValue: String(oldTask[key]),
        newValue: String(data[key]),
      });
    }

    if (data.assignees) {
      const oldIds = oldTask.assignees.map((assignee) => assignee.userId);
      const unassigned = oldIds.filter((id) => !data.assignees?.includes(id));
      const assigned = data.assignees.filter((id) => !oldIds.includes(id));

      const oldEmailMap = new Map(
        oldTask.assignees.map((a) => [a.userId, a.user.email]),
      );

      const newUsers = await this.prisma.user.findMany({
        where: {
          id: { in: assigned },
        },
        select: { id: true, email: true },
      });

      const newEmailMap = new Map(newUsers.map((u) => [u.id, u.email]));

      for (const id of unassigned) {
        logData.push({
          ...common,
          action: ActivityAction.UNASSIGNED,
          oldValue: oldEmailMap.get(id),
          newValue: null,
        });
      }

      for (const id of assigned) {
        logData.push({
          ...common,
          action: ActivityAction.ASSIGNED,
          oldValue: null,
          newValue: newEmailMap.get(id),
        });
      }
    }

    // Add bulk logs
    await this.activityLogs.logBulk(logData);

    return updatedTask;
  }

  async delete({
    id,
    userId,
    workspaceId,
  }: {
    id: string;
    userId: string;
    workspaceId: string;
  }) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const deletedTask = await this.prisma.task.update({
      where: { id, workspaceId },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      entityId: deletedTask.id,
      entityType: ActivityEntityType.TASK,
      action: ActivityAction.DELETED,
      actorUserId: userId,
      workspaceId,
    });

    return deletedTask;
  }
}
