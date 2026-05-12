import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { User } from './types';

export function useMeQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<User>('/users/me'),
  });
}

export function useUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: Boolean(id),
  });
}
