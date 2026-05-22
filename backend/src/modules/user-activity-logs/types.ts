import { UserActivityAction } from 'prisma/generated/enums';

export interface UserActivityLogInput {
  userId: string;
  action: UserActivityAction;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown>;
}
