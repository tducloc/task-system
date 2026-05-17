import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Task, CreateTaskInput, UpdateTaskInput } from "./types";
import { TaskStatus } from "./types";
import { workspaceKeys } from "@/features/workspaces/api";
import type { Membership } from "@/features/workspaces/types";

export const taskKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "tasks"] as const,
  detail: (workspaceId: string, id: string) =>
    ["workspaces", workspaceId, "tasks", id] as const,
};

export function useTasksQuery(workspaceId: string) {
  return useQuery({
    queryKey: taskKeys.all(workspaceId),
    queryFn: () => api.get<Task[]>(`/workspaces/${workspaceId}/tasks`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateTaskMutation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api.post<Task>(`/workspaces/${workspaceId}/tasks`, input),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: taskKeys.all(workspaceId) });
      const previousTasks = qc.getQueryData<Task[]>(taskKeys.all(workspaceId));

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: variables.title,
        status: variables.status || TaskStatus.TODO,
        workspaceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [],
      };

      qc.setQueryData<Task[]>(taskKeys.all(workspaceId), (old) => {
        return old ? [...old, optimisticTask] : [optimisticTask];
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(taskKeys.all(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
    },
  });
}

export function useUpdateTaskMutation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      api.patch<Task>(`/workspaces/${workspaceId}/tasks/${id}`, data),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: taskKeys.all(workspaceId) });
      const previousTasks = qc.getQueryData<Task[]>(taskKeys.all(workspaceId));

      qc.setQueryData<Task[]>(taskKeys.all(workspaceId), (old) => {
        return old?.map((task) => {
          if (task.id === variables.id) {
            const updatedTask = { ...task, updatedAt: new Date().toISOString() };
            if (variables.data.status) updatedTask.status = variables.data.status;
            if (variables.data.title) updatedTask.title = variables.data.title;
            
            if (variables.data.assignees) {
              const memberships = qc.getQueryData<Membership[]>(
                workspaceKeys.members(workspaceId)
              );
              
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
          }
          return task;
        });
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(taskKeys.all(workspaceId), context.previousTasks);
      }
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
      qc.invalidateQueries({ queryKey: taskKeys.detail(workspaceId, variables.id) });
    },
  });
}

export function useDeleteTaskMutation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${workspaceId}/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.all(workspaceId) });
      const previousTasks = qc.getQueryData<Task[]>(taskKeys.all(workspaceId));

      qc.setQueryData<Task[]>(taskKeys.all(workspaceId), (old) => {
        return old?.filter((task) => task.id !== id);
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(taskKeys.all(workspaceId), context.previousTasks);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(workspaceId) });
    },
  });
}
