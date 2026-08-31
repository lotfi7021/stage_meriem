import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../entities/user.entity';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const usersRepo = () => AppDataSource.getRepository(UserEntity);

router.use(authenticate);
router.use(requirePermissions('users:manage'));

/** GET /users */
router.get('/', async (_req: Request, res: Response) => {
  const users = await usersRepo().find({
    select: ['id', 'nom', 'email', 'role'],
  });
  res.json(users);
});

/** POST /users */
router.post('/', async (req: Request, res: Response) => {
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
});

/** PATCH /users/:id */
router.patch('/:id', async (req: Request, res: Response) => {
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
});

/** DELETE /users/:id */
router.delete('/:id', async (req: Request, res: Response) => {
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
});

export default router;
