import { Injectable, NotFoundException } from '@nestjs/common';

import { TaskStatus } from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';
import { checkIsPrismaError } from '@/utils/errors';

import { CreateTaskDto } from './dto/create-task.dto';
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

  async getAll(workspaceId: string) {
    return this.prisma.task.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });
  }

  async get(id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    return this.prisma.$transaction(async (tx) => {
      const { assignees, ...taskData } = data;

      const updatedTask = await tx.task.update({
        where: { id },
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
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      try {
        // Delete all assignee records
        await tx.taskAssignee.deleteMany({
          where: { taskId: id },
        });

        // Delete tasks
        return await tx.task.delete({
          where: { id },
        });
      } catch (e) {
        if (checkIsPrismaError(e) && e.code === 'P2025') {
          throw new NotFoundException('Task not found');
        }
      }
    });
  }
}
