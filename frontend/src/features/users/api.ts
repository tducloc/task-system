import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { userActivityLogKeys } from '@/features/user-activity-logs/api';

import type { UpdateMeInput, User } from './types';

export const userKeys = {
  me: ['me'] as const,
  detail: (id: string) => ['user', id] as const,
};

export function useMeQuery() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => api.get<User>('/users/me'),
  });
}

export function useUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateMeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => api.patch<User>('/users/me', input),
    onSuccess: (updated) => {
      qc.setQueryData(userKeys.me, updated);
      qc.invalidateQueries({ queryKey: userActivityLogKeys.root() });
    },
  });
}
