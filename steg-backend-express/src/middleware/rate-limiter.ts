import { Request, Response, NextFunction } from 'express';

const windowMs = 60_000; // 1 minute
const maxRequests = 200; // 200 req/min

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    res.status(429).json({
      statusCode: 429,
      message: 'Trop de requêtes. Réessayez dans 1 minute.',
    });
    return;
  }

  next();
}

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of hits) {
    if (now > value.resetAt) hits.delete(key);
  }
}, windowMs);
