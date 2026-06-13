import type { RequestHandler } from 'express';
import logger from '../utils/logger';

const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const payload = {
      request_id: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status_code: res.statusCode,
      latency_ms: Number(durationMs.toFixed(2))
    };

    if (res.statusCode >= 500) logger.error(payload, 'request completed');
    else if (res.statusCode >= 400) logger.warn(payload, 'request completed');
    else logger.info(payload, 'request completed');
  });

  next();
};

export default requestLogger;
