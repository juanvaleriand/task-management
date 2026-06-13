import { UniqueConstraintError } from 'sequelize';
import env from '../config/env';
import type { IdempotencyRepositoryPort, ExecuteIdempotentCommand, IdempotencyExecutionResult } from '../types/idempotency';
import type { UnitOfWorkPort } from '../types/repository';
import AppError from '../utils/app-error';
import KeyedMutex from '../utils/mutex';
import { createRequestHash } from '../utils/request-hash';

export interface IdempotencyServiceDependencies {
  idempotencyRepository: IdempotencyRepositoryPort;
  unitOfWork: UnitOfWorkPort;
  mutex?: KeyedMutex;
  ttlHours?: number;
}

export default class IdempotencyService {
  private readonly idempotencyRepository: IdempotencyRepositoryPort;
  private readonly unitOfWork: UnitOfWorkPort;
  private readonly mutex: KeyedMutex;
  private readonly ttlHours: number;

  constructor({ idempotencyRepository, unitOfWork, mutex = new KeyedMutex(), ttlHours = env.idempotencyTtlHours }: IdempotencyServiceDependencies) {
    this.idempotencyRepository = idempotencyRepository;
    this.unitOfWork = unitOfWork;
    this.mutex = mutex;
    this.ttlHours = ttlHours;
  }

  async execute<TBody>(command: ExecuteIdempotentCommand<TBody>): Promise<IdempotencyExecutionResult<TBody>> {
    const { key, userId, method, path, payload, callback } = command;
    const lockKey = `${userId}:${method}:${path}:${key}`;

    return this.mutex.runExclusive(lockKey, async () => {
      const now = new Date();
      const requestHash = createRequestHash({ userId, method, path, payload });

      return this.unitOfWork.transaction(async (transaction) => {
        const existing = await this.idempotencyRepository.findValid({ key, userId, method, path, now }, transaction);

        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new AppError(
              409,
              'IDEMPOTENCY_KEY_REUSED',
              'Idempotency-Key has already been used with a different request body'
            );
          }

          return {
            statusCode: existing.statusCode,
            body: existing.responseBody as TBody,
            replayed: true
          };
        }

        const result = await callback(transaction);
        const expiresAt = new Date(now.getTime() + this.ttlHours * 60 * 60 * 1000);

        try {
          await this.idempotencyRepository.create(
            {
              key,
              userId,
              method,
              path,
              requestHash,
              statusCode: result.statusCode,
              responseBody: result.body,
              expiresAt
            },
            transaction
          );
        } catch (error) {
          // Unique constraint is the final protection when the app runs in several Node.js processes.
          if (error instanceof UniqueConstraintError) {
            const duplicate = await this.idempotencyRepository.findValid({ key, userId, method, path, now }, transaction);
            if (duplicate && duplicate.requestHash === requestHash) {
              return {
                statusCode: duplicate.statusCode,
                body: duplicate.responseBody as TBody,
                replayed: true
              };
            }
          }

          throw error;
        }

        return { ...result, replayed: false };
      });
    });
  }
}
