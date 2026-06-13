import type { Request, Response } from 'express';
import { authService } from '../container';
import type { LoginSchema, RegisterSchema } from '../validators/auth.validator';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const validated = req.validated as RegisterSchema;
    const result = await authService.register(validated.body);
    res.status(201).json({ status: 'success', data: result });
  }

  async login(req: Request, res: Response): Promise<void> {
    const validated = req.validated as LoginSchema;
    const result = await authService.login(validated.body);
    res.status(200).json({ status: 'success', data: result });
  }
}

export default new AuthController();
