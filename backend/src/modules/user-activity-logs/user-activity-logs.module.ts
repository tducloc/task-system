import { Module } from '@nestjs/common';

import { UserActivityLogsController } from './user-activity-logs.controller';
import { UserActivityLogsService } from './user-activity-logs.service';

@Module({
  controllers: [UserActivityLogsController],
  providers: [UserActivityLogsService],
  exports: [UserActivityLogsService],
})
export class UserActivityLogsModule {}
