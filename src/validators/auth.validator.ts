import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(160),
    password: z.string().min(8).max(100),
    teamName: z.string().min(2).max(100).optional().default('Default Team')
  }),
  query: z.any(),
  params: z.any(),
  headers: z.any()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
    password: z.string().min(1).max(100)
  }),
  query: z.any(),
  params: z.any(),
  headers: z.any()
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
