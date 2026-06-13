import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import errorHandler from './middleware/error-handler.middleware';
import notFound from './middleware/not-found.middleware';
import requestContext from './middleware/request-context.middleware';
import requestLogger from './middleware/request-logger.middleware';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';

export default function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);
  app.use(requestLogger);

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'success', message: 'OK' });
  });

  app.use('/auth', authRoutes);
  app.use('/tasks', taskRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
