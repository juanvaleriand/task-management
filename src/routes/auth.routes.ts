import express from 'express';
import authController from '../controllers/auth.controller';
import validate from '../middleware/validate.middleware';
import asyncHandler from '../utils/async-handler';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

export default router;
