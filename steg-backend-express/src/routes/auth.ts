import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../entities/user.entity';
import { authenticate, signToken } from '../middleware/auth';

const router = Router();
const usersRepo = () => AppDataSource.getRepository(UserEntity);

/** POST /auth/login — rate limité: 5 req/min côté client, pas besoin de middleware ici pour un MVP */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body ?? {};
    if (!email || !motDePasse) {
      res.status(400).json({ statusCode: 400, message: 'email et motDePasse requis' });
      return;
    }

    const user = await usersRepo().findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ statusCode: 401, message: 'Identifiants invalides' });
      return;
    }

    const match = await bcrypt.compare(motDePasse, user.motDePasseHash);
    if (!match) {
      res.status(401).json({ statusCode: 401, message: 'Identifiants invalides' });
      return;
    }

    const accessToken = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      accessToken,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** POST /auth/logout */
router.post('/logout', authenticate, (_req: Request, res: Response) => {
  res.json({ loggedOut: true });
});

/** GET /auth/me */
router.get('/me', authenticate, (req: Request, res: Response) => {
  const u = req.user!;
  res.json({
    userId: u.userId,
    email: u.email,
    role: u.role,
    nom: u.email.split('@')[0],
  });
});

export default router;
