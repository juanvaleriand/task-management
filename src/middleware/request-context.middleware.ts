import type { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

const requestContext: RequestHandler = (req, res, next) => {
  const requestId = Array.isArray(req.headers['x-request-id'])
    ? req.headers['x-request-id'][0]
    : req.headers['x-request-id'];

  const id = requestId ?? uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestContext;
