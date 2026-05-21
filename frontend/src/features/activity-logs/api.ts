import { useQuery } from '@tanstack/react-query';
import qs from 'qs';

import { api } from '@/lib/api-client';

import type { ActivityLogPage, ActivityLogQueryParams } from './types';
import { ActivityEntityType } from './types';

export const activityLogKeys = {
  workspace: (workspaceId: string, params: ActivityLogQueryParams) =>
    ['workspaces', workspaceId, 'activity-logs', params] as const,
  task: (workspaceId: string, taskId: string, params: ActivityLogQueryParams) =>
    ['workspaces', workspaceId, 'tasks', taskId, 'activity-logs', params] as const,
};

export function useWorkspaceActivityLogsQuery(
  workspaceId: string,
  params: ActivityLogQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: activityLogKeys.workspace(workspaceId, params),
    queryFn: () =>
      api.get<ActivityLogPage>(
        `/workspaces/${workspaceId}/activity-logs?${qs.stringify(params, { skipNulls: true })}`,
      ),
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
    placeholderData: (prev) => prev,
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
