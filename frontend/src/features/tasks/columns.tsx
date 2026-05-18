import { createColumnHelper } from "@tanstack/react-table";
import { Trash2, CircleDashed, PlayCircle, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus } from "./types";
import type { Task } from "./types";
import type { Membership } from "@/features/workspaces/types";

export interface TaskTableMeta {
  memberships: Membership[];
  updatingId?: string;
  deletingId?: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange: (taskId: string, userId: string) => void;
  onDelete: (taskId: string) => void;
}

const STATUS_CONFIG = {
  [TaskStatus.TODO]: { label: "To Do", icon: CircleDashed, className: "text-muted-foreground" },
  [TaskStatus.IN_PROGRESS]: { label: "In Progress", icon: PlayCircle, className: "text-blue-500" },
  [TaskStatus.DONE]: { label: "Done", icon: CheckCircle2, className: "text-green-500" },
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const col = createColumnHelper<Task>();

export const columns = [
  col.display({
    id: "index",
    header: "#",
    cell: (info) => info.row.index + 1,
  }),

  col.accessor("title", {
    header: "Tên công việc",
    cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
  }),

  col.accessor("status", {
    header: "Trạng thái",
    cell: (info) => {
      const meta = info.table.options.meta as TaskTableMeta;
      const task = info.row.original;
      const isUpdating = meta.updatingId === task.id;

      return (
        <Select
          value={task.status}
          onValueChange={(val) => meta.onStatusChange(task.id, val as TaskStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 w-fit min-w-[100px] sm:min-w-[130px] px-2 border-none bg-transparent hover:bg-muted focus:ring-0 shadow-none font-medium text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TaskStatus).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cfg.className}`} />
                    <span>{cfg.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    },
  }),

  col.display({
    id: "assignee",
    header: "Người phụ trách",
    cell: (info) => {
      const meta = info.table.options.meta as TaskTableMeta;
      const task = info.row.original;
      const currentAssignee = task.assignees?.[0]?.userId ?? "unassigned";
      const isUpdating = meta.updatingId === task.id;

      return (
        <Select
          value={currentAssignee}
          onValueChange={(val) => meta.onAssigneeChange(task.id, val)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 w-fit min-w-[100px] sm:min-w-[140px] max-w-[200px] px-2 border-none bg-transparent hover:bg-muted focus:ring-0 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border-dashed border shrink-0 flex items-center justify-center">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Bỏ gán</span>
              </div>
            </SelectItem>
            {meta.memberships.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary shrink-0 flex items-center justify-center text-[10px] text-primary-foreground font-semibold uppercase">
                    {m.user.email.substring(0, 2)}
                  </div>
                  <span className="text-sm truncate">{m.user.email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  }),

  col.accessor("createdAt", {
    header: "Ngày tạo",
    cell: (info) => (
      <span className="text-muted-foreground text-[13px]">
        {dateFormatter.format(new Date(info.getValue()))}
      </span>
    ),
  }),

  col.accessor("updatedAt", {
    header: "Cập nhật",
    cell: (info) => (
      <span className="text-muted-foreground text-[13px]">
        {dateFormatter.format(new Date(info.getValue()))}
      </span>
    ),
  }),

  col.display({
    id: "actions",
    cell: (info) => {
      const meta = info.table.options.meta as TaskTableMeta;
      const task = info.row.original;
      const isDeleting = meta.deletingId === task.id;

      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => meta.onDelete(task.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
  }),
];
