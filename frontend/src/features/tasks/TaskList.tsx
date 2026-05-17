import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./api";
import { TaskStatus } from "./types";
import { useMembershipsQuery } from "@/features/workspaces/api";
import { ApiError } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskRow } from "./TaskRow";

interface TaskListProps {
  workspaceId: string;
}

export default function TaskList({ workspaceId }: TaskListProps) {
  const { data: tasks, isLoading: isLoadingTasks } = useTasksQuery(workspaceId);
  const { data: memberships, isLoading: isLoadingMembers } =
    useMembershipsQuery(workspaceId);
  const createMutation = useCreateTaskMutation(workspaceId);
  const updateMutation = useUpdateTaskMutation(workspaceId);
  const deleteMutation = useDeleteTaskMutation(workspaceId);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    // Clear input instantly for optimistic feel
    setNewTaskTitle("");

    createMutation.mutate(
      { title, status: TaskStatus.TODO },
      {
        onSuccess: () => {
          toast.success("Đã tạo thẻ mới!");
        },
        onError: (err) => {
          // Revert the input if failed
          setNewTaskTitle(title);
          toast.error(err instanceof ApiError ? err.message : "Lỗi tạo task");
        },
      }
    );
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateMutation.mutateAsync({ id: taskId, data: { status } });
      toast.success("Đã cập nhật trạng thái");
    } catch (err) {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleAssigneeChange = async (taskId: string, userId: string) => {
    try {
      const newAssignees = userId === "unassigned" ? [] : [userId];
      await updateMutation.mutateAsync({
        id: taskId,
        data: { assignees: newAssignees },
      });
      toast.success("Đã phân công người phụ trách");
    } catch (err) {
      toast.error("Lỗi phân công");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Bạn có chắc muốn xóa dòng này?")) return;
    try {
      await deleteMutation.mutateAsync(taskId);
      toast.success("Đã xóa task");
    } catch (err) {
      toast.error("Lỗi xóa task");
    }
  };

  if (isLoadingTasks || isLoadingMembers) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Tasks Database</h2>

      <div className="border rounded-xl shadow-sm bg-background">
        <Table>
          <TableHeader className="bg-muted/50 pointer-events-none">
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead className="min-w-[250px]">Tên công việc</TableHead>
              <TableHead className="w-[180px]">Trạng thái</TableHead>
              <TableHead className="w-[220px]">Người phụ trách</TableHead>
              <TableHead className="w-[110px]">Ngày tạo</TableHead>
              <TableHead className="w-[110px]">Cập nhật</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                index={index}
                memberships={memberships || []}
                isUpdating={updateMutation.isPending && updateMutation.variables?.id === task.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === task.id}
                onStatusChange={handleStatusChange}
                onAssigneeChange={handleAssigneeChange}
                onDelete={handleDelete}
              />
            ))}

            {/* Add New Row */}
            <TableRow className="bg-muted/5 hover:bg-muted/10 border-t-border/50">
              <TableCell className="text-center text-muted-foreground">
                <Plus className="h-4 w-4 mx-auto opacity-50" />
              </TableCell>
              <TableCell colSpan={6} className="p-0">
                <form
                  onSubmit={handleCreate}
                  className="flex h-full w-full items-center px-4 py-2"
                >
                  <input
                    type="text"
                    placeholder="Thêm một dòng mới... (Nhấn Enter để lưu)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0"
                  />
                  <button type="submit" className="hidden" />
                </form>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
