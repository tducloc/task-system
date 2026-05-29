import { Task, TaskAssignee, User } from 'prisma/generated/client';

export interface TaskListItem extends Task {
  assignees: (TaskAssignee & {
    user: Pick<User, 'id' | 'email'>;
  })[];
}

export interface TaskListResponse {
  data: TaskListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
