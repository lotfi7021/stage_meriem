import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { Role } from '../roles';

@Entity('users')
@Unique(['email'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  email: string;

  @Column({ name: 'mot_de_passe_hash' })
  motDePasseHash: string;

  @Column({ type: 'enum', enum: ['admin', 'agent'] })
  role: Role;
}
