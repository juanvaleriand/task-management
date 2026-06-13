export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  teamId: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface ListTaskQuery {
  status?: TaskStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface AssignTaskInput {
  assigneeId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalData: number;
  totalPage: number;
}
