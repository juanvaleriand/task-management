import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

export default class IdempotencyKey extends Model<InferAttributes<IdempotencyKey>, InferCreationAttributes<IdempotencyKey>> {
  declare id: CreationOptional<string>;
  declare key: string;
  declare userId: ForeignKey<User['id']>;
  declare method: string;
  declare path: string;
  declare requestHash: string;
  declare statusCode: number;
  declare responseBody: unknown;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

IdempotencyKey.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    method: {
      type: DataTypes.STRING(12),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    requestHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'request_hash'
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'status_code'
    },
    responseBody: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'response_body'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'idempotency_keys',
    indexes: [
      { unique: true, fields: ['key', 'user_id', 'method', 'path'] },
      { fields: ['expires_at'] }
    ]
  }
);
