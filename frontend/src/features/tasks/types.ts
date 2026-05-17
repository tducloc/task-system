export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface Task {
  id: string;
  title: string;
  workspaceId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignees?: TaskAssignee[];
}

export interface CreateTaskInput {
  title: string;
  status?: TaskStatus;
  assignees?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  assignees?: string[];
}
