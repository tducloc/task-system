import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyActivityLogsInfiniteQuery } from '@/features/user-activity-logs/api';
import {
  getUserActivityDescription,
  getUserActivityVisual,
  userActivityTimeFormatter,
} from '@/features/user-activity-logs/messageRenderer';
import { UserActivityAction } from '@/features/user-activity-logs/types';

const ACTION_OPTIONS: { value: UserActivityAction | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: UserActivityAction.PROFILE_UPDATED, label: 'Cập nhật hồ sơ' },
  { value: UserActivityAction.PASSWORD_CHANGED, label: 'Đổi mật khẩu' },
];

const SCROLL_TARGET_ID = 'user-activity-feed-scroll';

export default function UserActivityFeed() {
  const [actionFilter, setActionFilter] = useState<UserActivityAction | 'ALL'>('ALL');

  const { data, isLoading, hasNextPage, fetchNextPage } = useMyActivityLogsInfiniteQuery({
    action: actionFilter === 'ALL' ? undefined : actionFilter,
  });

  const logs = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Hoạt động gần đây</span>
          {total > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {logs.length} / {total}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <Select
          value={actionFilter}
          onValueChange={(v) => setActionFilter(v as UserActivityAction | 'ALL')}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo loại" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div id={SCROLL_TARGET_ID} className="flex-1 overflow-y-auto -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Chưa có hoạt động nào.
            </p>
          ) : (
            <InfiniteScroll
              dataLength={logs.length}
              next={fetchNextPage}
              hasMore={Boolean(hasNextPage)}
              scrollableTarget={SCROLL_TARGET_ID}
              loader={
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              }
              endMessage={
                <p className="text-center text-xs text-muted-foreground py-3">
                  Đã hết hoạt động
                </p>
              }
            >
              {logs.map((log, index) => {
                const { icon: Icon, color } = getUserActivityVisual(log);
                const isLast = index === logs.length - 1 && !hasNextPage;
                return (
                  <div key={log.id} className="flex gap-3 relative">
                    {!isLast && (
                      <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
                    )}
                    <div
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <p className="text-sm leading-snug text-muted-foreground">
                        {getUserActivityDescription(log)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {userActivityTimeFormatter.format(new Date(log.createdAt))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </InfiniteScroll>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
