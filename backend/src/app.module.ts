import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './database/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    MembershipsModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
