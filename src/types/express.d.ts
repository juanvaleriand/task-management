import type { AuthenticatedUser } from './task';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      validated?: any;
    }
  }
}

export {};
