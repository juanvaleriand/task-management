import { Sequelize } from 'sequelize';
import env from './env';
import logger from '../utils/logger';

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.dbLogging ? (message) => logger.debug({ sql: message }, 'sequelize') : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

export default sequelize;
