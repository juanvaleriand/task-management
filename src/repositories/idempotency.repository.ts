import { Op, type Transaction } from 'sequelize';
import { IdempotencyKey } from '../models';
import type {
  CreateIdempotencyInput,
  FindValidIdempotencyInput,
  IdempotencyRecord,
  IdempotencyRepositoryPort
} from '../types/idempotency';

export default class IdempotencyRepository implements IdempotencyRepositoryPort {
  async findValid(input: FindValidIdempotencyInput, transaction?: Transaction): Promise<IdempotencyRecord | null> {
    const record = await IdempotencyKey.findOne({
      where: {
        key: input.key,
        userId: input.userId,
        method: input.method,
        path: input.path,
        expiresAt: { [Op.gt]: input.now }
      },
      transaction
    });

    return record ? (record.get({ plain: true }) as IdempotencyRecord) : null;
  }

  async create(data: CreateIdempotencyInput, transaction?: Transaction): Promise<IdempotencyRecord> {
    const record = await IdempotencyKey.create(data, { transaction });
    return record.get({ plain: true }) as IdempotencyRecord;
  }
}
