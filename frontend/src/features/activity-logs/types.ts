import type { PaginatedResponse } from '@/features/tasks/types';

export enum ActivityEntityType {
  TASK = 'TASK',
  WORKSPACE = 'WORKSPACE',
  USER = 'USER',
  MEMBERSHIP = 'MEMBERSHIP',
}

export enum ActivityAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  JOINED = 'JOINED',
  LEFT = 'LEFT',
  KICKED = 'KICKED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
}

export interface ActivityLogUser {
  id: string;
  email: string;
}

export interface ActivityLog {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  workspaceId: string;
  actorUserId: string;
  actor: ActivityLogUser;
  targetUserId?: string | null;
  targetUser?: ActivityLogUser | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  entityType?: ActivityEntityType;
  entityId?: string;
  actorUserId?: string;
}

export type ActivityLogPage = PaginatedResponse<ActivityLog>;
