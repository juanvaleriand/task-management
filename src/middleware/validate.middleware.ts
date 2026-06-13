import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import AppError from '../utils/app-error';

export default function validate(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return next(new AppError(422, 'VALIDATION_ERROR', 'Validation error', details));
    }

    req.validated = result.data;
    return next();
  };
}
