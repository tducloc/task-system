import { Loader2 } from 'lucide-react';

import { useTaskActivityLogsQuery } from '@/features/activity-logs/api';
import {
  activityTimeFormatter,
  getActivityDescription,
  getActivityVisual,
} from '@/features/activity-logs/messageRenderer';

interface TaskActivityTimelineProps {
  workspaceId: string;
  taskId: string;
}

export default function TaskActivityTimeline({ workspaceId, taskId }: TaskActivityTimelineProps) {
  const { data, isLoading } = useTaskActivityLogsQuery(workspaceId, taskId);
  const logs = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground py-3">Chưa có hoạt động nào.</p>;
  }

  return (
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
                <span className="text-muted-foreground">{getActivityDescription(log)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activityTimeFormatter.format(new Date(log.createdAt))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
