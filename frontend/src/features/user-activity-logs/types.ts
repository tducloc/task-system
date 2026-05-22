import type { PaginatedResponse } from '@/features/tasks/types';

export enum UserActivityAction {
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: UserActivityAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserActivityLogQueryParams {
  page?: number;
  limit?: number;
  action?: UserActivityAction;
}

export type UserActivityLogPage = PaginatedResponse<UserActivityLog>;
