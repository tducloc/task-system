import { Trash2, CircleDashed, PlayCircle, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "./types";
import type { Task } from "./types";
import type { Membership } from "@/features/workspaces/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";

interface TaskRowProps {
  task: Task;
  index: number;
  memberships: Membership[];
  isUpdating: boolean;
  isDeleting: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssigneeChange: (taskId: string, userId: string) => void;
  onDelete: (taskId: string) => void;
}

const StatusIcon = ({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) => {
  switch (status) {
    case TaskStatus.TODO:
      return <CircleDashed className={`text-muted-foreground ${className}`} />;
    case TaskStatus.IN_PROGRESS:
      return <PlayCircle className={`text-blue-500 ${className}`} />;
    case TaskStatus.DONE:
      return <CheckCircle2 className={`text-green-500 ${className}`} />;
  }
};

export function TaskRow({
  task,
  index,
  memberships,
  isUpdating,
  isDeleting,
  onStatusChange,
  onAssigneeChange,
  onDelete,
}: TaskRowProps) {
  const currentAssignees = task.assignees?.map((a) => a.userId) || [];

  return (
    <TableRow className="group transition-colors hover:bg-muted/30">
      <TableCell className="text-center text-muted-foreground tabular-nums">
        {index + 1}
      </TableCell>
      <TableCell className="font-medium text-foreground">
        {task.title}
      </TableCell>
      <TableCell>
        <Select
          value={task.status}
          onValueChange={(val) => onStatusChange(task.id, val as TaskStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 w-fit min-w-[130px] px-2 border-none bg-transparent hover:bg-muted focus:ring-0 shadow-none font-medium text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaskStatus.TODO}>
              <div className="flex items-center gap-2">
                <StatusIcon status={TaskStatus.TODO} className="w-4 h-4" />
                <span>To Do</span>
              </div>
            </SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>
              <div className="flex items-center gap-2">
                <StatusIcon status={TaskStatus.IN_PROGRESS} className="w-4 h-4" />
                <span>In Progress</span>
              </div>
            </SelectItem>
            <SelectItem value={TaskStatus.DONE}>
              <div className="flex items-center gap-2">
                <StatusIcon status={TaskStatus.DONE} className="w-4 h-4" />
                <span>Done</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={currentAssignees[0] || "unassigned"}
          onValueChange={(val) => onAssigneeChange(task.id, val)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 w-fit min-w-[140px] max-w-[200px] px-2 border-none bg-transparent hover:bg-muted focus:ring-0 shadow-none">
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
            {memberships?.map((m) => (
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
      </TableCell>
      <TableCell className="text-muted-foreground text-[13px]">
        {new Date(task.createdAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className="text-muted-foreground text-[13px]">
        {new Date(task.updatedAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(task.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
