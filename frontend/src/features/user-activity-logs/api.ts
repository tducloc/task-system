import { useInfiniteQuery } from '@tanstack/react-query';
import qs from 'qs';

import { api } from '@/lib/api-client';

import type { UserActivityAction, UserActivityLogPage } from './types';

export const USER_ACTIVITY_PAGE_SIZE = 30;

export const userActivityLogKeys = {
  root: () => ['me', 'activities'] as const,
  infinite: (filter: { action?: UserActivityAction }) =>
    ['me', 'activities', 'infinite', filter] as const,
};

export function useMyActivityLogsInfiniteQuery(filter: { action?: UserActivityAction }) {
  return useInfiniteQuery({
    queryKey: userActivityLogKeys.infinite(filter),
    queryFn: ({ pageParam }) =>
      api.get<UserActivityLogPage>(
        `/users/me/activities?${qs.stringify(
          { ...filter, page: pageParam, limit: USER_ACTIVITY_PAGE_SIZE },
          { skipNulls: true },
        )}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPage ? lastPage.meta.page + 1 : undefined,
  });
}
