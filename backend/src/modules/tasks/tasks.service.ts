import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'prisma/generated/client';
import { TaskStatus } from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';
import { OrderBy } from '@/types/sorts';
import { checkIsPrismaError } from '@/utils/errors';

import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto, SortBy } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, data: CreateTaskDto) {
    return this.prisma.$transaction(async (tx) => {
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
  }

  async getAll(workspaceId: string, query: QueryTaskDto) {
    // Sort

    // Filter

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

      // Page
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
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, workspaceId: string, data: UpdateTaskDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
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
      } catch (e) {
        if (checkIsPrismaError(e) && e.code === 'P2025') {
          throw new NotFoundException('Task not found');
        }
      }
    });
  }

  async delete(id: string, workspaceId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.$transaction(async (tx) => {
      try {
        // Delete all assignee records
        await tx.taskAssignee.deleteMany({
          where: { taskId: id },
        });

        // Delete tasks
        return await tx.task.delete({
          where: { id, workspaceId },
        });
      } catch (e) {
        if (checkIsPrismaError(e) && e.code === 'P2025') {
          throw new NotFoundException('Task not found');
        }
      }
    });
  }
}
