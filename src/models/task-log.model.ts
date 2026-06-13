import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';
import Task from './task.model';
import User from './user.model';

export default class TaskLog extends Model<InferAttributes<TaskLog>, InferCreationAttributes<TaskLog>> {
  declare id: CreationOptional<string>;
  declare taskId: ForeignKey<Task['id']>;
  declare actorUserId: ForeignKey<User['id']>;
  declare action: string;
  declare oldValue: Record<string, unknown> | null;
  declare newValue: Record<string, unknown> | null;
  declare createdAt: CreationOptional<Date>;
}

TaskLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'task_id'
    },
    actorUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'actor_user_id'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    oldValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'old_value'
    },
    newValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'new_value'
    },
    createdAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'task_logs',
    updatedAt: false,
    indexes: [{ fields: ['task_id'] }, { fields: ['actor_user_id'] }]
  }
);
