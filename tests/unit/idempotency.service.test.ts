import type { Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import IdempotencyService from '../../src/services/idempotency.service';
import type { CreateIdempotencyInput, FindValidIdempotencyInput, IdempotencyRecord, IdempotencyRepositoryPort } from '../../src/types/idempotency';
import type { UnitOfWorkPort } from '../../src/types/repository';
import KeyedMutex from '../../src/utils/mutex';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

class MemoryUnitOfWork implements UnitOfWorkPort {
  async transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    return callback({} as Transaction);
  }
}

class MemoryIdempotencyRepository implements IdempotencyRepositoryPort {
  private readonly records: IdempotencyRecord[] = [];

  async findValid(input: FindValidIdempotencyInput): Promise<IdempotencyRecord | null> {
    return (
      this.records.find(
        (record) =>
          record.key === input.key &&
          record.userId === input.userId &&
          record.method === input.method &&
          record.path === input.path &&
          record.expiresAt > input.now
      ) ?? null
    );
  }

  async create(data: CreateIdempotencyInput): Promise<IdempotencyRecord> {
    const duplicate = this.records.find(
      (record) =>
        record.key === data.key &&
        record.userId === data.userId &&
        record.method === data.method &&
        record.path === data.path
    );

    if (duplicate) throw new Error('unique constraint violation');

    const record: IdempotencyRecord = { ...data, id: uuidv4() };
    this.records.push(record);
    return record;
  }
}

interface FakeTask {
  id: string;
  title: string;
  status: string;
}

class FakeTaskRepository {
  readonly tasks: FakeTask[] = [];

  async createTask(payload: { title: string; status?: string }): Promise<FakeTask> {
    await sleep(10);
    const task = {
      id: uuidv4(),
      title: payload.title,
      status: payload.status ?? 'todo'
    };
    this.tasks.push(task);
    return task;
  }
}

describe('IdempotencyService race condition protection', () => {
  function createSubject(): { service: IdempotencyService; taskRepository: FakeTaskRepository } {
    const idempotencyRepository = new MemoryIdempotencyRepository();
    const taskRepository = new FakeTaskRepository();
    const service = new IdempotencyService({
      idempotencyRepository,
      unitOfWork: new MemoryUnitOfWork(),
      mutex: new KeyedMutex(),
      ttlHours: 24
    });

    return { service, taskRepository };
  }

  test('sequential duplicate returns identical response and creates only one task', async () => {
    const { service, taskRepository } = createSubject();
    const userId = uuidv4();
    const key = uuidv4();
    const payload = { title: 'Write API test', status: 'todo' };

    const callback = async () => {
      const task = await taskRepository.createTask(payload);
      return { statusCode: 201, body: { status: 'success', data: task } };
    };

    const first = await service.execute({ key, userId, method: 'POST', path: '/tasks', payload, callback });
    const second = await service.execute({ key, userId, method: 'POST', path: '/tasks', payload, callback });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.replayed).toBe(true);
    expect(second.body).toEqual(first.body);
    expect(taskRepository.tasks).toHaveLength(1);
  });

  test('concurrent duplicate requests with same key create exactly one task', async () => {
    const { service, taskRepository } = createSubject();
    const userId = uuidv4();
    const key = uuidv4();
    const payload = { title: 'Concurrency safe task', status: 'todo' };
    const totalRequests = 25;

    const callback = async () => {
      const task = await taskRepository.createTask(payload);
      return { statusCode: 201, body: { status: 'success', data: task } };
    };

    const results = await Promise.all(
      Array.from({ length: totalRequests }, () =>
        service.execute({ key, userId, method: 'POST', path: '/tasks', payload, callback })
      )
    );

    expect(taskRepository.tasks).toHaveLength(1);
    expect(results.every((item) => item.statusCode === 201)).toBe(true);
    expect(results.every((item) => item.body.data.id === results[0].body.data.id)).toBe(true);
    expect(results.filter((item) => item.replayed).length).toBe(totalRequests - 1);
  });

  test('same key with different payload is rejected', async () => {
    const { service, taskRepository } = createSubject();
    const userId = uuidv4();
    const key = uuidv4();

    const callback = async (payload: { title: string }) => {
      const task = await taskRepository.createTask(payload);
      return { statusCode: 201, body: { status: 'success', data: task } };
    };

    await service.execute({
      key,
      userId,
      method: 'POST',
      path: '/tasks',
      payload: { title: 'Original' },
      callback: () => callback({ title: 'Original' })
    });

    await expect(
      service.execute({
        key,
        userId,
        method: 'POST',
        path: '/tasks',
        payload: { title: 'Changed' },
        callback: () => callback({ title: 'Changed' })
      })
    ).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_KEY_REUSED' });

    expect(taskRepository.tasks).toHaveLength(1);
  });
});
