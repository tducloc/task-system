import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { getUserInfo } from './utils/get-user-info';
import { checkIsPrismaError } from '@/utils/errors';

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
}
