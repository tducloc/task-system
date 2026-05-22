import { Module } from '@nestjs/common';

import { UserActivityLogsModule } from '../user-activity-logs/user-activity-logs.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UserActivityLogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
