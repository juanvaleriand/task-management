export interface ValidationDetail {
  field: string;
  message: string;
}

export default class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ValidationDetail[];

  constructor(status: number, code: string, message: string, details?: ValidationDetail[]) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
