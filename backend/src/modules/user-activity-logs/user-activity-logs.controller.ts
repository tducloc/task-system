import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/decorators/current-user.decorator';

import { QueryUserActivityLogDto } from './dto/query-user-activity-log.dto';
import { UserActivityLogsService } from './user-activity-logs.service';

@Controller('users/me/activities')
export class UserActivityLogsController {
  constructor(private readonly service: UserActivityLogsService) {}

  @Get()
  getMyActivities(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryUserActivityLogDto,
  ) {
    return this.service.getAll(user.sub, query);
  }
}
