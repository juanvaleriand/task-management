import type { Transaction } from 'sequelize';
import { sequelize } from '../models';
import type { UnitOfWorkPort } from '../types/repository';

export default class SequelizeUnitOfWork implements UnitOfWorkPort {
  transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    return sequelize.transaction(async (transaction) => callback(transaction));
  }
}
