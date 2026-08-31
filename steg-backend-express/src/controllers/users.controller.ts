import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../entities/user.entity';

const usersRepo = () => AppDataSource.getRepository(UserEntity);

export class UsersController {
  /**
   * GET /users
   * Récupère tous les utilisateurs
   */
  static async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await usersRepo().find({
        select: ['id', 'nom', 'email', 'role'],
      });
      res.json(users);
    } catch (err) {
      console.error('Get all users error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * POST /users
   * Crée un nouvel utilisateur
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { nom, email, motDePasse, role } = req.body ?? {};
      if (!nom || !email || !motDePasse || !role) {
        res.status(400).json({ statusCode: 400, message: 'nom, email, motDePasse, role requis' });
        return;
      }
      const validRoles = ['admin', 'agent'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ statusCode: 400, message: `role invalide. Valeurs: ${validRoles.join(', ')}` });
        return;
      }
      if (motDePasse.length < 8) {
        res.status(400).json({ statusCode: 400, message: 'motDePasse: minimum 8 caractères' });
        return;
      }

      const existing = await usersRepo().findOne({ where: { email } });
      if (existing) {
        res.status(409).json({ statusCode: 409, message: 'Un utilisateur avec cet email existe déjà' });
        return;
      }

      const motDePasseHash = await bcrypt.hash(motDePasse, 12);
      const user = usersRepo().create({ nom, email, motDePasseHash, role });
      const saved = await usersRepo().save(user);
      const { motDePasseHash: _, ...result } = saved as any;
      res.status(201).json(result);
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * PATCH /users/:id
   * Met à jour un utilisateur existant
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, email, motDePasse, role } = req.body ?? {};

      const user = await usersRepo().findOne({ where: { id } });
      if (!user) {
        res.status(404).json({ statusCode: 404, message: `Utilisateur ${id} introuvable` });
        return;
      }

      if (motDePasse) {
        user.motDePasseHash = await bcrypt.hash(motDePasse, 12);
      }
      if (nom) user.nom = nom;
      if (email) user.email = email;
      if (role) user.role = role;

      const saved = await usersRepo().save(user);
      const { motDePasseHash: _, ...result } = saved as any;
      res.json(result);
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * DELETE /users/:id
   * Supprime un utilisateur
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersRepo().findOne({ where: { id } });
      if (!user) {
        res.status(404).json({ statusCode: 404, message: `Utilisateur ${id} introuvable` });
        return;
      }
      await usersRepo().remove(user);
      res.json({ deleted: true });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }
}
