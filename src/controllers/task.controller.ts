import type { Request, Response } from 'express';
import { idempotencyService, taskService } from '../container';
import AppError from '../utils/app-error';
import type { AssignTaskSchema, CreateTaskSchema, ListTaskSchema, TaskIdSchema, UpdateTaskSchema } from '../validators/task.validator';

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'User is not authenticated');
  return req.user;
}

class TaskController {
  async create(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as CreateTaskSchema;
    const idempotencyKey = validated.headers['idempotency-key'];

    const result = await idempotencyService.execute({
      key: idempotencyKey,
      userId: user.id,
      method: 'POST',
      path: '/tasks',
      payload: validated.body,
      callback: async (transaction) => {
        const task = await taskService.createTask(user, validated.body, transaction);
        return {
          statusCode: 201,
          body: { status: 'success', data: task }
        };
      }
    });

    if (result.replayed) res.setHeader('Idempotency-Replayed', 'true');
    res.status(result.statusCode).json(result.body);
  }

  async list(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as ListTaskSchema;
    const result = await taskService.listTasks(user, validated.query);
    res.status(200).json({ status: 'success', ...result });
  }

  async detail(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as TaskIdSchema;
    const task = await taskService.getTask(user, validated.params.id);
    res.status(200).json({ status: 'success', data: task });
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as UpdateTaskSchema;
    const task = await taskService.updateTask(user, validated.params.id, validated.body);
    res.status(200).json({ status: 'success', data: task });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as TaskIdSchema;
    await taskService.deleteTask(user, validated.params.id);
    res.status(204).send();
  }

  async assign(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const validated = req.validated as AssignTaskSchema;
    const task = await taskService.assignTask(user, validated.params.id, validated.body.assigneeId);
    res.status(200).json({ status: 'success', data: task });
  }
}

export default new TaskController();
