import { createHash } from 'crypto';

import { QueryTaskDto } from '../dto/query-task.dto';

export const TASK_LIST_CACHE_TTL_SEC = 60;

export const buildTaskListCacheKey = (
  workspaceId: string,
  query: QueryTaskDto,
): string => {
  // Normalize: sort keys + lowercase array values để 2 query khác thứ tự = cùng key
  const normalized = {
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    orderBy: query.orderBy,
    search: query.search ?? null,
    statuses: query.statuses ? [...query.statuses].sort() : null,
    assignees: query.assignees ? [...query.assignees].sort() : null,
  };

  const hash = createHash('sha1')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 12);

  return `tasks:list:${workspaceId}:${hash}`;
};
