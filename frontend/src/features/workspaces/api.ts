import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { activityLogKeys } from '@/features/activity-logs/api';
import type {
  CreateWorkspaceInput,
  Membership,
  UpdateMembershipInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceDetail,
} from './types';

// ─── Query Keys ──────────────────────────────────────────────
export const workspaceKeys = {
  all: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
  members: (id: string) => ['workspaces', id, 'memberships'] as const,
};

// ─── Queries ─────────────────────────────────────────────────
export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => api.get<Workspace[]>('/workspaces'),
  });
}

export function useWorkspaceQuery(id: string | undefined) {
  return useQuery({
    queryKey: workspaceKeys.detail(id!),
    queryFn: () => api.get<WorkspaceDetail>(`/workspaces/${id}`),
    enabled: Boolean(id),
  });
}

export function useMembershipsQuery(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId!),
    queryFn: () => api.get<Membership[]>(`/workspaces/${workspaceId}/memberships`),
    enabled: Boolean(workspaceId),
  });
}

// ─── Mutations ───────────────────────────────────────────────
export function useCreateWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      api.post<Workspace>('/workspaces', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useUpdateWorkspaceMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorkspaceInput) =>
      api.patch<Workspace>(`/workspaces/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: activityLogKeys.workspaceRoot(id) });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useJoinWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Membership>(`/workspaces/${id}/join`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
      qc.invalidateQueries({ queryKey: activityLogKeys.workspaceRoot(id) });
    },
  });
}

export function useUpdateMembershipMutation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, data }: { membershipId: string; data: UpdateMembershipInput }) =>
      api.patch<Membership>(`/workspaces/${workspaceId}/memberships/${membershipId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      qc.invalidateQueries({ queryKey: activityLogKeys.workspaceRoot(workspaceId) });
    },
  });
}

export function useDeleteMembershipMutation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) =>
      api.delete(`/workspaces/${workspaceId}/memberships/${membershipId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
      qc.invalidateQueries({ queryKey: activityLogKeys.workspaceRoot(workspaceId) });
    },
  });
}
