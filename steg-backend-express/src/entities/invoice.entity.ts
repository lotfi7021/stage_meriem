import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientEntity } from './client.entity';

export type InvoiceStatus = 'payee' | 'en_attente' | 'en_retard' | 'impayee';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryColumn()
  id: string; // ex: "FAC-00001"

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => ClientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: ClientEntity;

  @Column('decimal', { precision: 12, scale: 3 })
  montant: number;

  @Column({ name: 'date_emission', type: 'date' })
  dateEmission: string; // "YYYY-MM-DD"

  @Column({ name: 'date_echeance', type: 'date' })
  dateEcheance: string; // "YYYY-MM-DD"

  @Column({ type: 'enum', enum: ['payee', 'en_attente', 'en_retard', 'impayee'] })
  statut: InvoiceStatus;

  @Column('decimal', { name: 'montant_paye', precision: 12, scale: 3, default: 0 })
  montantPaye: number;
}
