import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import env from '../config/env';
import { User } from '../models';
import AppError from '../utils/app-error';

const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload & { sub?: string };
    if (!decoded.sub) throw new AppError(401, 'UNAUTHORIZED', 'Invalid token subject');

    const user = await User.findByPk(decoded.sub, {
      attributes: ['id', 'name', 'email', 'teamId']
    });

    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'User token is no longer valid');

    req.user = user.toPublicJSON();
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
};

export default authenticate;
