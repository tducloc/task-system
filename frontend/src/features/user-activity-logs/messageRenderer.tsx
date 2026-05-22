import { KeyRound, UserCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { UserActivityLog } from './types';
import { UserActivityAction } from './types';

interface ActivityVisual {
  icon: LucideIcon;
  color: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Tên hiển thị',
};

export function getUserActivityVisual(log: UserActivityLog): ActivityVisual {
  switch (log.action) {
    case UserActivityAction.PASSWORD_CHANGED:
      return { icon: KeyRound, color: 'text-amber-500' };
    case UserActivityAction.PROFILE_UPDATED:
    default:
      return { icon: UserCog, color: 'text-blue-500' };
  }
}

export function getUserActivityDescription(log: UserActivityLog): string {
  const { action, field, oldValue, newValue } = log;

  if (action === UserActivityAction.PASSWORD_CHANGED) {
    return 'đã đổi mật khẩu';
  }

  if (action === UserActivityAction.PROFILE_UPDATED && field) {
    const label = FIELD_LABELS[field] ?? field;
    const oldText = oldValue ?? 'trống';
    const newText = newValue ?? 'trống';
    return `đã đổi ${label} từ "${oldText}" sang "${newText}"`;
  }

  return 'đã cập nhật hồ sơ';
}

export const userActivityTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
