import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import qs from "qs";
import { api } from "@/lib/api-client";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryParams,
  PaginatedResponse,
} from "./types";
import { TaskStatus } from "./types";
import { workspaceKeys } from "@/features/workspaces/api";
import type { Membership } from "@/features/workspaces/types";
import { DEFAULT_LIMIT } from "./useTaskFilters";

export const taskKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "tasks"] as const,
  list: (workspaceId: string, params: TaskQueryParams) =>
    ["workspaces", workspaceId, "tasks", params] as const,
  detail: (workspaceId: string, id: string) =>
    ["workspaces", workspaceId, "tasks", id] as const,
};

export function useTasksQuery(workspaceId: string, params: TaskQueryParams) {
  return useQuery({
    queryKey: taskKeys.list(workspaceId, params),
    queryFn: () =>
      api.get<PaginatedResponse<Task>>(
        `/workspaces/${workspaceId}/tasks?${qs.stringify(params, { arrayFormat: "repeat", skipNulls: true })}`
      ),
    enabled: Boolean(workspaceId),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTaskMutation(
  workspaceId: string,
  params: TaskQueryParams,
  onPageChange: (page: number) => void
) {
  const qc = useQueryClient();
  const queryKey = taskKeys.list(workspaceId, params);

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api.post<Task>(`/workspaces/${workspaceId}/tasks`, input),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<PaginatedResponse<Task>>(queryKey);

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: variables.title,
        status: variables.status || TaskStatus.TODO,
        workspaceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [],
      };

      const newTotal = (previous?.meta.total ?? 0) + 1;
      const newTotalPage = Math.ceil(newTotal / params.limit);
      const isOnLastPage = params.page >= (previous?.meta.totalPage ?? 1);
      const isLastPageFull = previous ? previous.data.length >= params.limit : false;

      // Only append optimistically when on last page AND still has room.
      // All other cases: just update meta counts (server refetch will show correct data).
      const canAppend = isOnLastPage && !isLastPageFull;

      qc.setQueryData<PaginatedResponse<Task>>(queryKey, (old) => {
        if (!old) {
          return {
            data: [optimisticTask],
            meta: { page: 1, limit: params.limit, total: 1, totalPage: 1 },
          };
        }
        return {
          ...old,
          data: canAppend ? [...old.data, optimisticTask] : old.data,
          meta: { ...old.meta, total: newTotal, totalPage: newTotalPage },
        };
      });

      // If last page was full → navigate to new page after server confirms
      const shouldNavigate = isOnLastPage && isLastPageFull;
      return { previous, shouldNavigate, newPage: newTotalPage };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.shouldNavigate) {
        onPageChange(context.newPage);
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
    },
  });
}

export function useUpdateTaskMutation(workspaceId: string, params: TaskQueryParams) {
  const qc = useQueryClient();
  const queryKey = taskKeys.list(workspaceId, params);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      api.patch<Task>(`/workspaces/${workspaceId}/tasks/${id}`, data),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<PaginatedResponse<Task>>(queryKey);

      qc.setQueryData<PaginatedResponse<Task>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((task) => {
            if (task.id !== variables.id) return task;

            const updatedTask = { ...task, updatedAt: new Date().toISOString() };
            if (variables.data.status) { updatedTask.status = variables.data.status; }
            if (variables.data.title) { updatedTask.title = variables.data.title; }
            if (variables.data.assignees) {
              const memberships = qc.getQueryData<Membership[]>(workspaceKeys.members(workspaceId));
              updatedTask.assignees = variables.data.assignees.map((userId) => {
                const existing = task.assignees?.find((a) => a.userId === userId);
                if (existing) return existing;
                const member = memberships?.find((m) => m.userId === userId);
                return {
                  id: `temp-assignee-${Date.now()}`,
                  taskId: task.id,
                  userId,
                  user: member?.user || { id: userId, email: "..." },
                };
              });
            }
            return updatedTask;
          }),
        };
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) { qc.setQueryData(queryKey, context.previous); }
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
      qc.invalidateQueries({ queryKey: taskKeys.detail(workspaceId, variables.id) });
    },
  });
}

export function useDeleteTaskMutation(
  workspaceId: string,
  params: TaskQueryParams,
  onPageChange: (page: number) => void
) {
  const qc = useQueryClient();
  const queryKey = taskKeys.list(workspaceId, params);

  return useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${workspaceId}/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<PaginatedResponse<Task>>(queryKey);

      const newTotal = Math.max((previous?.meta.total ?? 1) - 1, 0);
      const newTotalPage = Math.max(Math.ceil(newTotal / params.limit), 1);

      // If last page has only this 1 item and we're on it → need to go back
      const isLastItem = previous?.data.length === 1;
      const isOnLastPage = params.page >= (previous?.meta.totalPage ?? 1);
      const shouldGoBack = isLastItem && isOnLastPage && params.page > 1;

      qc.setQueryData<PaginatedResponse<Task>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((task) => task.id !== id),
          meta: { ...old.meta, total: newTotal, totalPage: newTotalPage },
        };
      });

      return { previous, shouldGoBack, targetPage: params.page - 1 };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.shouldGoBack) {
        onPageChange(context.targetPage);
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) { qc.setQueryData(queryKey, context.previous); }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
    },
  });
}
