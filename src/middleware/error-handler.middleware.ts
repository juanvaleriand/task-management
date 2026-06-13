import type { ErrorRequestHandler } from 'express';
import env from '../config/env';
import AppError from '../utils/app-error';
import logger from '../utils/logger';

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isOperational = err instanceof AppError;
  const status = isOperational ? err.status : 500;
  const code = isOperational ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isOperational ? err.message : 'Something went wrong';

  if (status >= 500) {
    logger.error({ err, request_id: req.requestId }, 'unhandled error');
  }

  const body: Record<string, unknown> = {
    status,
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (isOperational && err.details) body.details = err.details;
  if (env.nodeEnv !== 'production' && !isOperational && err instanceof Error) body.debug = err.message;

  res.status(status).json(body);
};

export default errorHandler;
