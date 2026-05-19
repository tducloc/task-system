import { Loader2, Plus, Pencil, Trash2, UserPlus, UserMinus } from "lucide-react";
import { useTaskActivityLogsQuery } from "./api";
import { TaskActivityAction } from "./types";
import type { TaskActivityLog } from "./types";

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const ACTION_CONFIG: Record<TaskActivityAction, { icon: typeof Plus; label: string; color: string }> = {
  [TaskActivityAction.CREATED]: { icon: Plus, label: "Tạo task", color: "text-green-500" },
  [TaskActivityAction.UPDATED]: { icon: Pencil, label: "Cập nhật", color: "text-blue-500" },
  [TaskActivityAction.DELETED]: { icon: Trash2, label: "Xóa task", color: "text-red-500" },
  [TaskActivityAction.ASSIGNED]: { icon: UserPlus, label: "Gán người", color: "text-violet-500" },
  [TaskActivityAction.UNASSIGNED]: { icon: UserMinus, label: "Bỏ gán", color: "text-orange-500" },
};

const FIELD_LABELS: Record<string, string> = {
  title: "Tên",
  status: "Trạng thái",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function formatValue(field: string | undefined, value: string | null | undefined): string {
  if (!value) return "trống";
  if (field === "status") return STATUS_LABELS[value] ?? value;
  return value;
}

function getDescription(log: TaskActivityLog): string {
  const { action, field, oldValue, newValue } = log;

  if (action === TaskActivityAction.CREATED) return "đã tạo task này";
  if (action === TaskActivityAction.DELETED) return "đã xóa task này";

  if (action === TaskActivityAction.ASSIGNED) {
    return `đã gán ${newValue ?? ""}`;
  }
  if (action === TaskActivityAction.UNASSIGNED) {
    return `đã bỏ gán ${oldValue ?? ""}`;
  }

  if (action === TaskActivityAction.UPDATED && field) {
    const fieldLabel = FIELD_LABELS[field] ?? field;
    return `đã đổi ${fieldLabel} từ "${formatValue(field, oldValue)}" sang "${formatValue(field, newValue)}"`;
  }

  return `đã thực hiện ${action}`;
}

interface TaskActivityTimelineProps {
  workspaceId: string;
  taskId: string;
}

export default function TaskActivityTimeline({ workspaceId, taskId }: TaskActivityTimelineProps) {
  const { data: logs, isLoading } = useTaskActivityLogsQuery(workspaceId, taskId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground py-3">Chưa có hoạt động nào.</p>;
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const config = ACTION_CONFIG[log.action] ?? ACTION_CONFIG[TaskActivityAction.UPDATED];
        const Icon = config.icon;
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
            )}
            {/* Icon */}
            <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted ${config.color}`}>
              <Icon className="h-3 w-3" />
            </div>
            {/* Content */}
            <div className="flex-1 pb-4 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-medium">{log.user.email}</span>{" "}
                <span className="text-muted-foreground">{getDescription(log)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timeFormatter.format(new Date(log.createdAt))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
