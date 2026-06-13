import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  databaseUrl: string;
  dbLogging: boolean;
  idempotencyTtlHours: number;
}

const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://task_user:task_password@localhost:5432/task_management',
  dbLogging: process.env.DB_LOGGING === 'true',
  idempotencyTtlHours: Number(process.env.IDEMPOTENCY_TTL_HOURS ?? 24)
};

export default env;
