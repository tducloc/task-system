import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import bcrypt from 'bcrypt';
import { Prisma } from 'prisma/generated/client';
import { UserActivityAction } from 'prisma/generated/enums';

import { PrismaService } from '@/database/prisma.service';
import { checkIsPrismaError } from '@/utils/errors';

import { UserActivityLogInput } from '../user-activity-logs/types';
import { UserActivityLogsService } from '../user-activity-logs/user-activity-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { getUserInfo } from './utils/get-user-info';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private activityLog: UserActivityLogsService,
  ) {}

  async create(user: CreateUserDto) {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: user.email,
          password: bcrypt.hashSync(user.password, 10),
        },
      });

      return getUserInfo(newUser);
    } catch (error: unknown) {
      if (checkIsPrismaError(error) && error.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }

      throw error;
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return getUserInfo(user);
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateMeDto) {
    const oldData = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!oldData) {
      throw new NotFoundException('User not found');
    }

    if (!data.name && !data.newPassword) {
      throw new BadRequestException('Nothing to update');
    }

    const updatedData: Prisma.UserUpdateInput = {};
    const activityLogs: UserActivityLogInput[] = [];

    if (data.name && data.name !== oldData.name) {
      updatedData['name'] = data.name;
      activityLogs.push({
        userId,
        action: UserActivityAction.PROFILE_UPDATED,
        field: 'name',
        oldValue: oldData.name,
        newValue: data.name,
      });
    }

    if (data.newPassword && data.currentPassword) {
      const isPasswordValid = bcrypt.compareSync(
        data.currentPassword,
        oldData.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      updatedData['password'] = bcrypt.hashSync(data.newPassword, 10);
      activityLogs.push({
        userId,
        action: UserActivityAction.PASSWORD_CHANGED,
        field: 'password',
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updatedData,
    });

    await this.activityLog.logBulk(activityLogs);

    return getUserInfo(updatedUser);
  }
}
