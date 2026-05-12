import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import bcrypt from 'bcrypt';

import { PrismaService } from '@/database/prisma.service';
import { checkIsPrismaError } from '@/utils/errors';

import { CreateUserDto } from './dto/create-user.dto';
import { getUserInfo } from './utils/get-user-info';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
