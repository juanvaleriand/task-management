import type { Transaction } from 'sequelize';
import type { CreateTaskInput, AuthenticatedUser, ListTaskQuery, UpdateTaskInput } from '../types/task';
import type { TaskDTO, TaskLogRepositoryPort, TaskRepositoryPort, UnitOfWorkPort, UserRepositoryPort } from '../types/repository';
import AppError from '../utils/app-error';
import type NotificationService from './notification.service';

export interface TaskServiceDependencies {
  taskRepository: TaskRepositoryPort;
  taskLogRepository: TaskLogRepositoryPort;
  userRepository: UserRepositoryPort;
  unitOfWork: UnitOfWorkPort;
  notificationService: NotificationService;
}

export default class TaskService {
  private readonly taskRepository: TaskRepositoryPort;
  private readonly taskLogRepository: TaskLogRepositoryPort;
  private readonly userRepository: UserRepositoryPort;
  private readonly unitOfWork: UnitOfWorkPort;
  private readonly notificationService: NotificationService;

  constructor(dependencies: TaskServiceDependencies) {
    this.taskRepository = dependencies.taskRepository;
    this.taskLogRepository = dependencies.taskLogRepository;
    this.userRepository = dependencies.userRepository;
    this.unitOfWork = dependencies.unitOfWork;
    this.notificationService = dependencies.notificationService;
  }

  async createTask(user: AuthenticatedUser, payload: CreateTaskInput, transaction?: Transaction): Promise<TaskDTO> {
    return this.taskRepository.create(
      {
        title: payload.title,
        description: payload.description ?? null,
        status: payload.status ?? 'todo',
        ownerId: user.id,
        assigneeId: user.id,
        teamId: user.teamId
      },
      transaction
    );
  }

  async listTasks(user: AuthenticatedUser, query: ListTaskQuery): Promise<{ data: TaskDTO[]; pagination: { page: number; limit: number; totalData: number; totalPage: number } }> {
    const result = await this.taskRepository.listByOwner(user.id, query);

    return {
      data: result.rows,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalData: result.total,
        totalPage: Math.ceil(result.total / query.limit)
      }
    };
  }

  async getTask(user: AuthenticatedUser, taskId: string): Promise<TaskDTO> {
    const task = await this.taskRepository.findOwnedById(taskId, user.id);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
    return task;
  }

  async updateTask(user: AuthenticatedUser, taskId: string, payload: UpdateTaskInput): Promise<TaskDTO> {
    const task = await this.taskRepository.updateOwnedById(taskId, user.id, payload);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
    return task;
  }

  async deleteTask(user: AuthenticatedUser, taskId: string): Promise<void> {
    const deleted = await this.taskRepository.deleteOwnedById(taskId, user.id);
    if (!deleted) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
  }

  async assignTask(user: AuthenticatedUser, taskId: string, assigneeId: string): Promise<TaskDTO> {
    return this.unitOfWork.transaction(async (transaction) => {
      const assignee = await this.userRepository.findById(assigneeId, transaction);
      if (!assignee) throw new AppError(404, 'ASSIGNEE_NOT_FOUND', 'Assignee not found');

      if (assignee.teamId !== user.teamId) {
        throw new AppError(403, 'ASSIGNEE_NOT_IN_SAME_TEAM', 'Assignee must be in the same team');
      }

      const updateResult = await this.taskRepository.updateAssignee(taskId, user.id, assigneeId, transaction);
      if (!updateResult) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found');

      const { task, oldAssigneeId } = updateResult;
      await this.taskLogRepository.create(
        {
          taskId: task.id,
          actorUserId: user.id,
          action: 'ASSIGN_TASK',
          oldValue: { assigneeId: oldAssigneeId },
          newValue: { assigneeId }
        },
        transaction
      );

      await this.notificationService.sendTaskAssigned({
        taskId: task.id,
        assigneeId,
        actorUserId: user.id
      });

      return task;
    });
  }
}
