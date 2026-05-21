import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useWorkspaceActivityLogsQuery } from './api';
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

interface WorkspaceActivityFeedProps {
  workspaceId: string;
}

export default function WorkspaceActivityFeed({ workspaceId }: WorkspaceActivityFeedProps) {
  const [entityFilter, setEntityFilter] = useState<ActivityEntityType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useWorkspaceActivityLogsQuery(workspaceId, {
    page,
    limit,
    entityType: entityFilter === 'ALL' ? undefined : entityFilter,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const hasNext = meta ? page < meta.totalPage : false;
  const hasPrev = page > 1;

  function handleFilterChange(value: string) {
    setEntityFilter(value as ActivityEntityType | 'ALL');
    setPage(1);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <Select value={entityFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full">
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
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Chưa có hoạt động nào.
          </p>
        ) : (
          <div className="space-y-0">
            {logs.map((log, index) => {
              const { icon: Icon, color } = getActivityVisual(log);
              const isLast = index === logs.length - 1;

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
          </div>
        )}
      </div>

      {meta && meta.total > limit && (
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Trang {page} / {meta.totalPage} ({meta.total} hoạt động)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
