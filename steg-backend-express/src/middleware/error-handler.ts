import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err);
  res.status(500).json({
    statusCode: 500,
    timestamp: new Date().toISOString(),
    message: 'Erreur interne du serveur',
  });
}
