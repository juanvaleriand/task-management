import { Op, type Transaction } from 'sequelize';
import { Task, TaskLog, User } from '../models';
import type { AuthenticatedUser } from '../types/task';
import type {
  TaskDTO,
  TaskLogCreateInput,
  TaskLogDTO,
  TaskLogRepositoryPort,
  TaskRepositoryPort,
  UserRepositoryPort
} from '../types/repository';
import type { CreateTaskInput, ListTaskQuery, UpdateTaskInput } from '../types/task';

export class TaskRepository implements TaskRepositoryPort {
  async create(
    data: CreateTaskInput & { ownerId: string; assigneeId: string; teamId: string },
    transaction?: Transaction
  ): Promise<TaskDTO> {
    const task = await Task.create(
      {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'todo',
        ownerId: data.ownerId,
        assigneeId: data.assigneeId,
        teamId: data.teamId
      },
      { transaction }
    );

    return task.get({ plain: true }) as TaskDTO;
  }

  async listByOwner(ownerId: string, query: ListTaskQuery, transaction?: Transaction): Promise<{ rows: TaskDTO[]; total: number }> {
    const where: Record<string, unknown> = { ownerId };

    if (query.status) where.status = query.status;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };

    const offset = (query.page - 1) * query.limit;
    const { rows, count } = await Task.findAndCountAll({
      where,
      limit: query.limit,
      offset,
      order: [['createdAt', 'DESC']],
      transaction
    });

    return {
      rows: rows.map((row) => row.get({ plain: true }) as TaskDTO),
      total: count
    };
  }

  async findOwnedById(id: string, ownerId: string, transaction?: Transaction): Promise<TaskDTO | null> {
    const task = await Task.findOne({ where: { id, ownerId }, transaction });
    return task ? (task.get({ plain: true }) as TaskDTO) : null;
  }

  async updateOwnedById(id: string, ownerId: string, data: UpdateTaskInput, transaction?: Transaction): Promise<TaskDTO | null> {
    const task = await Task.findOne({ where: { id, ownerId }, transaction });
    if (!task) return null;

    await task.update(data, { transaction });
    return task.get({ plain: true }) as TaskDTO;
  }

  async deleteOwnedById(id: string, ownerId: string, transaction?: Transaction): Promise<number> {
    return Task.destroy({ where: { id, ownerId }, transaction });
  }

  async updateAssignee(
    id: string,
    ownerId: string,
    assigneeId: string,
    transaction?: Transaction
  ): Promise<{ task: TaskDTO; oldAssigneeId: string | null } | null> {
    const task = await Task.findOne({ where: { id, ownerId }, transaction, lock: transaction?.LOCK.UPDATE });
    if (!task) return null;

    const oldAssigneeId = task.assigneeId;
    await task.update({ assigneeId }, { transaction });

    return {
      task: task.get({ plain: true }) as TaskDTO,
      oldAssigneeId
    };
  }
}

export class TaskLogRepository implements TaskLogRepositoryPort {
  async create(data: TaskLogCreateInput, transaction?: Transaction): Promise<TaskLogDTO> {
    const log = await TaskLog.create(data, { transaction });
    return log.get({ plain: true }) as TaskLogDTO;
  }

  async listByTaskId(taskId: string, transaction?: Transaction): Promise<TaskLogDTO[]> {
    const rows = await TaskLog.findAll({
      where: { taskId },
      order: [['createdAt', 'DESC']],
      transaction
    });

    return rows.map((row) => row.get({ plain: true }) as TaskLogDTO);
  }
}

export class UserRepository implements UserRepositoryPort {
  async findById(id: string, transaction?: Transaction): Promise<AuthenticatedUser | null> {
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'teamId'],
      transaction
    });

    return user ? user.toPublicJSON() : null;
  }
}
