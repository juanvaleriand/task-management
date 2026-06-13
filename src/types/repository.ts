import type { Transaction } from 'sequelize';
import type { AuthenticatedUser, CreateTaskInput, ListTaskQuery, TaskStatus, UpdateTaskInput } from './task';

export interface UnitOfWorkPort {
  transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ownerId: string;
  assigneeId: string | null;
  teamId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskLogDTO {
  id: string;
  taskId: string;
  actorUserId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface TaskLogCreateInput {
  taskId: string;
  actorUserId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

export interface TaskRepositoryPort {
  create(data: CreateTaskInput & { ownerId: string; assigneeId: string; teamId: string }, transaction?: Transaction): Promise<TaskDTO>;
  listByOwner(ownerId: string, query: ListTaskQuery, transaction?: Transaction): Promise<{ rows: TaskDTO[]; total: number }>;
  findOwnedById(id: string, ownerId: string, transaction?: Transaction): Promise<TaskDTO | null>;
  updateOwnedById(id: string, ownerId: string, data: UpdateTaskInput, transaction?: Transaction): Promise<TaskDTO | null>;
  deleteOwnedById(id: string, ownerId: string, transaction?: Transaction): Promise<number>;
  updateAssignee(id: string, ownerId: string, assigneeId: string, transaction?: Transaction): Promise<{ task: TaskDTO; oldAssigneeId: string | null } | null>;
}

export interface TaskLogRepositoryPort {
  create(data: TaskLogCreateInput, transaction?: Transaction): Promise<TaskLogDTO>;
  listByTaskId(taskId: string, transaction?: Transaction): Promise<TaskLogDTO[]>;
}

export interface UserRepositoryPort {
  findById(id: string, transaction?: Transaction): Promise<AuthenticatedUser | null>;
}
