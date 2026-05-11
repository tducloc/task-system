import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
