import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../entities/user.entity';
import { signToken } from '../middleware/auth';

const usersRepo = () => AppDataSource.getRepository(UserEntity);

export class AuthController {
  /**
   * POST /auth/login
   * Authentifie un utilisateur et retourne un token JWT
   */
  static async login(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * POST /auth/logout
   * Déconnecte l'utilisateur (côté client, supprime le token)
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.json({ loggedOut: true });
  }

  /**
   * GET /auth/me
   * Retourne les informations de l'utilisateur connecté
   */
  static async me(req: Request, res: Response): Promise<void> {
    const u = req.user!;
    res.json({
      userId: u.userId,
      email: u.email,
      role: u.role,
      nom: u.email.split('@')[0],
    });
  }
}
