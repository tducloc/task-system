import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import bcrypt from 'bcrypt';
import 'dotenv/config';

import { PrismaService } from '@/database/prisma.service';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(account: LoginDto) {
    try {
      // Get user
      const user = await this.usersService.findOneByEmail(account.email);

      // Check password
      const isMatch = await bcrypt.compare(account.password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException(
          'Your email or password is not correct!',
        );
      }

      // Create jwt token
      const payload = {
        sub: user.id,
      };

      const token = await this.jwtService.signAsync(payload);

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      return {
        accessToken: token,
        refreshToken,
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  // Write refresh token function
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Check token exist
      const exstingToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!exstingToken) {
        throw new UnauthorizedException(
          'Your refresh token is invalid or has been revoked!',
        );
      }

      // Check token is expired
      if (exstingToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Your refresh token is expired!');
      }

      // Generate new access token
      const newAccessToken = await this.jwtService.signAsync({
        sub: payload.sub,
      });

      // Generate new refresh token
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: payload.sub },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Rotate: Delete old token and save new token
      // In a highly concurrent env, it's safer to use a transaction
      await this.prisma.$transaction([
        this.prisma.refreshToken.delete({ where: { token: refreshToken } }),
        this.prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: payload.sub,
            expiresAt,
          },
        }),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return {
        message: 'Logout successful',
      };
    } catch (error: unknown) {
      throw error;
    }
  }
}
