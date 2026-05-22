import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import qs from 'qs';

import { api } from '@/lib/api-client';

import type { ActivityLogPage, ActivityLogQueryParams } from './types';
import { ActivityEntityType } from './types';

export const ACTIVITY_FEED_PAGE_SIZE = 30;

export const activityLogKeys = {
  workspaceRoot: (workspaceId: string) =>
    ['workspaces', workspaceId, 'activity-logs'] as const,
  workspaceInfinite: (
    workspaceId: string,
    filter: Pick<ActivityLogQueryParams, 'entityType' | 'entityId' | 'actorUserId'>,
  ) => ['workspaces', workspaceId, 'activity-logs', 'infinite', filter] as const,
  taskRoot: (workspaceId: string, taskId: string) =>
    ['workspaces', workspaceId, 'tasks', taskId, 'activity-logs'] as const,
  task: (workspaceId: string, taskId: string, params: ActivityLogQueryParams) =>
    ['workspaces', workspaceId, 'tasks', taskId, 'activity-logs', params] as const,
};

export function useWorkspaceActivityLogsInfiniteQuery(
  workspaceId: string,
  filter: Pick<ActivityLogQueryParams, 'entityType' | 'entityId' | 'actorUserId'>,
) {
  return useInfiniteQuery({
    queryKey: activityLogKeys.workspaceInfinite(workspaceId, filter),
    queryFn: ({ pageParam }) =>
      api.get<ActivityLogPage>(
        `/workspaces/${workspaceId}/activity-logs?${qs.stringify(
          { ...filter, page: pageParam, limit: ACTIVITY_FEED_PAGE_SIZE },
          { skipNulls: true },
        )}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPage ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(workspaceId),
  });
}

export function useTaskActivityLogsQuery(
  workspaceId: string,
  taskId: string | null,
  params: ActivityLogQueryParams = { page: 1, limit: 50 },
) {
  return useQuery({
    queryKey: activityLogKeys.task(workspaceId, taskId ?? '', params),
    queryFn: () =>
      api.get<ActivityLogPage>(
        `/workspaces/${workspaceId}/tasks/${taskId}/activity-logs?${qs.stringify(params, { skipNulls: true })}`,
      ),
    enabled: Boolean(workspaceId && taskId),
  });
}

export { ActivityEntityType };
