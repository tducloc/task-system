import {
  Building2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { ActivityLog } from './types';
import { ActivityAction, ActivityEntityType } from './types';

interface ActivityVisual {
  icon: LucideIcon;
  color: string;
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Chủ',
  MEMBER: 'Thành viên',
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Tên',
  status: 'Trạng thái',
  name: 'Tên',
  role: 'Vai trò',
};

function formatFieldValue(field: string | null | undefined, value: string | null | undefined): string {
  if (!value) return 'trống';
  if (field === 'status') return STATUS_LABELS[value] ?? value;
  if (field === 'role') return ROLE_LABELS[value] ?? value;
  return value;
}

export function getActivityVisual(log: ActivityLog): ActivityVisual {
  switch (log.action) {
    case ActivityAction.CREATED:
      if (log.entityType === ActivityEntityType.WORKSPACE) {
        return { icon: Building2, color: 'text-emerald-500' };
      }
      return { icon: Plus, color: 'text-green-500' };
    case ActivityAction.UPDATED:
      return { icon: Pencil, color: 'text-blue-500' };
    case ActivityAction.DELETED:
      return { icon: Trash2, color: 'text-red-500' };
    case ActivityAction.JOINED:
      return { icon: LogIn, color: 'text-teal-500' };
    case ActivityAction.LEFT:
      return { icon: LogOut, color: 'text-orange-500' };
    case ActivityAction.KICKED:
      return { icon: UserX, color: 'text-rose-600' };
    case ActivityAction.ASSIGNED:
      return { icon: UserPlus, color: 'text-violet-500' };
    case ActivityAction.UNASSIGNED:
      return { icon: UserMinus, color: 'text-orange-500' };
    default:
      return { icon: Pencil, color: 'text-muted-foreground' };
  }
}

export function getActivityDescription(log: ActivityLog): string {
  const { entityType, action, field, oldValue, newValue } = log;
  const target = log.targetUser?.email ?? 'người dùng';

  if (entityType === ActivityEntityType.WORKSPACE) {
    if (action === ActivityAction.CREATED) return 'đã tạo workspace này';
    if (action === ActivityAction.UPDATED && field) {
      const fieldLabel = FIELD_LABELS[field] ?? field;
      return `đã đổi ${fieldLabel} workspace từ "${formatFieldValue(field, oldValue)}" sang "${formatFieldValue(field, newValue)}"`;
    }
    return `đã thực hiện ${action} workspace`;
  }

  if (entityType === ActivityEntityType.MEMBERSHIP) {
    if (action === ActivityAction.JOINED) return 'đã tham gia workspace';
    if (action === ActivityAction.LEFT) return 'đã rời workspace';
    if (action === ActivityAction.KICKED) return `đã loại ${target} khỏi workspace`;
    if (action === ActivityAction.UPDATED && field === 'role') {
      return `đã đổi vai trò của ${target} từ "${formatFieldValue(field, oldValue)}" sang "${formatFieldValue(field, newValue)}"`;
    }
    return `đã thực hiện ${action} thành viên`;
  }

  if (entityType === ActivityEntityType.TASK) {
    if (action === ActivityAction.CREATED) return 'đã tạo task này';
    if (action === ActivityAction.DELETED) return 'đã xóa task này';
    if (action === ActivityAction.ASSIGNED) return `đã gán ${newValue ?? ''}`;
    if (action === ActivityAction.UNASSIGNED) return `đã bỏ gán ${oldValue ?? ''}`;
    if (action === ActivityAction.UPDATED && field) {
      const fieldLabel = FIELD_LABELS[field] ?? field;
      return `đã đổi ${fieldLabel} từ "${formatFieldValue(field, oldValue)}" sang "${formatFieldValue(field, newValue)}"`;
    }
    return `đã thực hiện ${action}`;
  }

  return `đã thực hiện ${action}`;
}

export const activityTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
