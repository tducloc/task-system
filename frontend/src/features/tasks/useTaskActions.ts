import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./api";
import { TaskStatus } from "./types";
import type { TaskQueryParams } from "./types";
import { ApiError } from "@/lib/api-client";

export function useTaskActions(
  workspaceId: string,
  queryParams: TaskQueryParams,
  onPageChange: (page: number) => void
) {
  const createMutation = useCreateTaskMutation(workspaceId, queryParams, onPageChange);
  const updateMutation = useUpdateTaskMutation(workspaceId, queryParams);
  const deleteMutation = useDeleteTaskMutation(workspaceId, queryParams, onPageChange);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = newTaskTitle.trim();
      if (!title) return;

      setNewTaskTitle("");
      createMutation.mutate(
        { title, status: TaskStatus.TODO },
        {
          onSuccess: () => toast.success("Đã tạo thẻ mới!"),
          onError: (err) => {
            setNewTaskTitle(title);
            toast.error(err instanceof ApiError ? err.message : "Lỗi tạo task");
          },
        }
      );
    },
    [newTaskTitle, createMutation]
  );

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      updateMutation.mutate(
        { id: taskId, data: { status } },
        {
          onSuccess: () => toast.success("Đã cập nhật trạng thái"),
          onError: () => toast.error("Lỗi cập nhật"),
        }
      );
    },
    [updateMutation]
  );

  const handleAssigneeChange = useCallback(
    (taskId: string, userId: string) => {
      const newAssignees = userId === "unassigned" ? [] : [userId];
      updateMutation.mutate(
        { id: taskId, data: { assignees: newAssignees } },
        {
          onSuccess: () => toast.success("Đã phân công người phụ trách"),
          onError: () => toast.error("Lỗi phân công"),
        }
      );
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      if (!confirm("Bạn có chắc muốn xóa dòng này?")) return;
      deleteMutation.mutate(taskId, {
        onSuccess: () => toast.success("Đã xóa task"),
        onError: () => toast.error("Lỗi xóa task"),
      });
    },
    [deleteMutation]
  );

  return {
    newTaskTitle,
    setNewTaskTitle,
    updateMutation,
    deleteMutation,
    handleCreate,
    handleStatusChange,
    handleAssigneeChange,
    handleDelete,
  };
}
