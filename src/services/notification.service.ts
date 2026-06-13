import logger from '../utils/logger';

export interface TaskAssignedNotificationPayload {
  taskId: string;
  assigneeId: string;
  actorUserId: string;
}

export default class NotificationService {
  async sendTaskAssigned(payload: TaskAssignedNotificationPayload): Promise<boolean> {
    logger.info(
      {
        task_id: payload.taskId,
        assignee_id: payload.assigneeId,
        actor_user_id: payload.actorUserId
      },
      'mock notification: task assigned'
    );

    return true;
  }
}
