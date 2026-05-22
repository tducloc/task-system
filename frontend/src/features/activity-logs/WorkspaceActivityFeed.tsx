import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useWorkspaceActivityLogsInfiniteQuery } from './api';
import {
  activityTimeFormatter,
  getActivityDescription,
  getActivityVisual,
} from './messageRenderer';
import { ActivityEntityType } from './types';

const ENTITY_TYPE_OPTIONS: { value: ActivityEntityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: ActivityEntityType.WORKSPACE, label: 'Workspace' },
  { value: ActivityEntityType.MEMBERSHIP, label: 'Thành viên' },
  { value: ActivityEntityType.TASK, label: 'Task' },
];

const SCROLL_TARGET_ID = 'workspace-activity-feed-scroll';

interface WorkspaceActivityFeedProps {
  workspaceId: string;
}

export default function WorkspaceActivityFeed({ workspaceId }: WorkspaceActivityFeedProps) {
  const [entityFilter, setEntityFilter] = useState<ActivityEntityType | 'ALL'>('ALL');

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useWorkspaceActivityLogsInfiniteQuery(workspaceId, {
    entityType: entityFilter === 'ALL' ? undefined : entityFilter,
  });

  const logs = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Select
          value={entityFilter}
          onValueChange={(v) => setEntityFilter(v as ActivityEntityType | 'ALL')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Lọc theo loại" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {total > 0 && (
          <p className="text-xs text-muted-foreground">
            {logs.length} / {total}
          </p>
        )}
      </div>

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
              const { icon: Icon, color } = getActivityVisual(log);
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
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{log.actor.email}</span>{' '}
                      <span className="text-muted-foreground">
                        {getActivityDescription(log)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activityTimeFormatter.format(new Date(log.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
