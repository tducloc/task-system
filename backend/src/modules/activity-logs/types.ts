import { ActivityAction, ActivityEntityType } from 'prisma/generated/enums';

export interface ActivityLogInput {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  workspaceId: string;
  actorUserId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}
