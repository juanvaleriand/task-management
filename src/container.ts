import IdempotencyRepository from './repositories/idempotency.repository';
import SequelizeUnitOfWork from './repositories/sequelize-unit-of-work';
import { TaskLogRepository, TaskRepository, UserRepository } from './repositories/task.repository';
import AuthService from './services/auth.service';
import IdempotencyService from './services/idempotency.service';
import NotificationService from './services/notification.service';
import TaskService from './services/task.service';

const unitOfWork = new SequelizeUnitOfWork();
const taskRepository = new TaskRepository();
const taskLogRepository = new TaskLogRepository();
const userRepository = new UserRepository();
const idempotencyRepository = new IdempotencyRepository();
const notificationService = new NotificationService();

export const authService = new AuthService();
export const taskService = new TaskService({
  taskRepository,
  taskLogRepository,
  userRepository,
  unitOfWork,
  notificationService
});
export const idempotencyService = new IdempotencyService({ idempotencyRepository, unitOfWork });
