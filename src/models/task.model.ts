import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';
import Team from './team.model';
import User from './user.model';
import { TASK_STATUSES, TaskStatus } from '../types/task';

export default class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: string | null;
  declare status: TaskStatus;
  declare ownerId: ForeignKey<User['id']>;
  declare assigneeId: ForeignKey<User['id']> | null;
  declare teamId: ForeignKey<Team['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUSES),
      allowNull: false,
      defaultValue: 'todo'
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id'
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assignee_id'
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'team_id'
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'tasks',
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['assignee_id'] },
      { fields: ['team_id'] },
      { fields: ['status'] },
      { fields: ['title'] }
    ]
  }
);
