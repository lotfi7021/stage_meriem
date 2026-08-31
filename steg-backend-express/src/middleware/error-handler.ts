import { Request, Response, NextFunction } from 'express';

export class HttpException extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'HttpException';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpException) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      message: err.message,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    statusCode: 500,
    timestamp: new Date().toISOString(),
    message: 'Erreur interne du serveur',
  });
}
