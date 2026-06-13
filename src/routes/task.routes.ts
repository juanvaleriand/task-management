import express from 'express';
import taskController from '../controllers/task.controller';
import authenticate from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import asyncHandler from '../utils/async-handler';
import { assignTaskSchema, createTaskSchema, listTaskSchema, taskIdSchema, updateTaskSchema } from '../validators/task.validator';

const router = express.Router();

router.use(authenticate);
router.post('/', validate(createTaskSchema), asyncHandler(taskController.create));
router.get('/', validate(listTaskSchema), asyncHandler(taskController.list));
router.get('/:id', validate(taskIdSchema), asyncHandler(taskController.detail));
router.put('/:id', validate(updateTaskSchema), asyncHandler(taskController.update));
router.delete('/:id', validate(taskIdSchema), asyncHandler(taskController.delete));
router.post('/:id/assign', validate(assignTaskSchema), asyncHandler(taskController.assign));

export default router;
