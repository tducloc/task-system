export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum SortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  STATUS = 'status',
}

export enum OrderBy {
  ASC = 'asc',
  DESC = 'desc',
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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface TaskQueryParams {
  page: number;
  limit: number;
  sortBy?: SortBy;
  orderBy?: OrderBy;
  statuses?: TaskStatus[];
  assignees?: string[];
  search?: string;
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

export enum TaskActivityAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
}

export interface TaskActivityLog {
  id: string;
  action: TaskActivityAction;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  taskId: string;
  userId: string;
  user: { id: string; email: string };
  workspaceId: string;
  createdAt: string;
}
