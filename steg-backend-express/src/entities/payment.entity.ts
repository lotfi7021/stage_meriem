import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

type PaymentMethod = 'virement' | 'especes' | 'cheque' | 'en_ligne';

@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn()
  id: string; // ex: "PAY-00001"

  @Column({ name: 'facture_id' })
  factureId: string;

  @ManyToOne(() => InvoiceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facture_id' })
  invoice: InvoiceEntity;

  @Column('decimal', { precision: 12, scale: 3 })
  montant: number;

  @Column({ name: 'date_paiement', type: 'date' })
  datePaiement: string;

  @Column({ type: 'enum', enum: ['virement', 'especes', 'cheque', 'en_ligne'] })
  methode: PaymentMethod;
}
