import createApp from './app';
import env from './config/env';
import { sequelize } from './models';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();
    const app = createApp();

    app.listen(env.port, () => {
      logger.info({ port: env.port }, 'Task Management API is running');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  process.exit(1);
});

void bootstrap();
