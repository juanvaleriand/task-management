import { sequelize } from '../models';
import logger from '../utils/logger';

async function syncDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    logger.info('Database synced successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to sync database');
    process.exit(1);
  }
}

void syncDatabase();
