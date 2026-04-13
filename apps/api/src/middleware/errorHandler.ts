import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message);

  const status = (err as any).status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
