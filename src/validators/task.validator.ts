import { z } from 'zod';
import { TASK_STATUSES } from '../types/task';

const uuid = z.string().uuid();
const taskStatus = z.enum(TASK_STATUSES);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional().nullable(),
    status: taskStatus.optional().default('todo')
  }),
  query: z.any(),
  params: z.any(),
  headers: z
    .object({
      'idempotency-key': uuid
    })
    .passthrough()
});

export const listTaskSchema = z.object({
  body: z.any(),
  query: z.object({
    status: taskStatus.optional(),
    search: z.string().max(160).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10)
  }),
  params: z.any(),
  headers: z.any()
});

export const taskIdSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: uuid }),
  headers: z.any()
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).optional().nullable(),
      status: taskStatus.optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided'
    }),
  query: z.any(),
  params: z.object({ id: uuid }),
  headers: z.any()
});

export const assignTaskSchema = z.object({
  body: z.object({
    assigneeId: uuid
  }),
  query: z.any(),
  params: z.object({ id: uuid }),
  headers: z.any()
});

export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type ListTaskSchema = z.infer<typeof listTaskSchema>;
export type TaskIdSchema = z.infer<typeof taskIdSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;
export type AssignTaskSchema = z.infer<typeof assignTaskSchema>;
