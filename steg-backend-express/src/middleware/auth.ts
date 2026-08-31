import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role, hasPermission, Permission } from '../roles';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

/** Middleware JWT: vérifie le token Bearer et attache user à req. */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ statusCode: 401, message: 'Token manquant' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ statusCode: 401, message: 'Token invalide ou expiré' });
  }
}

/** Génère un JWT. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as any,
  });
}

/** Factory de middleware de permission: vérifie que l'utilisateur a au moins une des permissions requises. */
export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Non authentifié' });
      return;
    }
    const ok = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!ok) {
      res.status(403).json({
        statusCode: 403,
        message: `Permission manquante: ${permissions.join(', ')}`,
      });
      return;
    }
    next();
  };
}
