import type { Transaction } from 'sequelize';

export interface IdempotencyRecord {
  id?: string;
  key: string;
  userId: string;
  method: string;
  path: string;
  requestHash: string;
  statusCode: number;
  responseBody: unknown;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FindValidIdempotencyInput {
  key: string;
  userId: string;
  method: string;
  path: string;
  now: Date;
}

export interface CreateIdempotencyInput {
  key: string;
  userId: string;
  method: string;
  path: string;
  requestHash: string;
  statusCode: number;
  responseBody: unknown;
  expiresAt: Date;
}

export interface IdempotencyRepositoryPort {
  findValid(input: FindValidIdempotencyInput, transaction?: Transaction): Promise<IdempotencyRecord | null>;
  create(data: CreateIdempotencyInput, transaction?: Transaction): Promise<IdempotencyRecord>;
}

export interface IdempotencyExecutionResult<TBody> {
  statusCode: number;
  body: TBody;
  replayed: boolean;
}

export interface ExecuteIdempotentCommand<TBody> {
  key: string;
  userId: string;
  method: string;
  path: string;
  payload: unknown;
  callback: (transaction: Transaction) => Promise<Omit<IdempotencyExecutionResult<TBody>, 'replayed'>>;
}
