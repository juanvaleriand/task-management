import sequelize from '../config/database';
import Team from './team.model';
import User from './user.model';
import Task from './task.model';
import TaskLog from './task-log.model';
import IdempotencyKey from './idempotency-key.model';

Team.hasMany(User, { foreignKey: 'teamId', as: 'users' });
User.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

Team.hasMany(Task, { foreignKey: 'teamId', as: 'tasks' });
Task.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

User.hasMany(Task, { foreignKey: 'ownerId', as: 'ownedTasks' });
Task.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

Task.hasMany(TaskLog, { foreignKey: 'taskId', as: 'logs' });
TaskLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });

User.hasMany(IdempotencyKey, { foreignKey: 'userId', as: 'idempotencyKeys' });
IdempotencyKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, Team, User, Task, TaskLog, IdempotencyKey };
