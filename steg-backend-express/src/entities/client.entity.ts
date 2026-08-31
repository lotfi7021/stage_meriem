import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

export type ClientType = 'particulier' | 'entreprise' | 'administration';

@Entity('clients')
export class ClientEntity {
  @PrimaryColumn()
  id: string; // ex: "CLI-00001"

  @Column()
  nom: string;

  @Column({ type: 'enum', enum: ['particulier', 'entreprise', 'administration'] })
  type: ClientType;

  @Column()
  secteur: string;

  @Column()
  adresse: string;

  @Column({ name: 'anciennete_mois', type: 'int', default: 0 })
  ancienneteMois: number;

  @Column({ name: 'retards_passes', type: 'int', default: 0 })
  retardsPasses: number;

  @Column({ name: 'delai_moyen_jours', type: 'int', default: 0 })
  delaiMoyenJours: number;
}

export const SECTEURS_BY_TYPE: Record<ClientType, string[]> = {
  particulier: ['Résidentiel', 'Commercial', 'Agriculture'],
  entreprise: ['Industrie', 'Commerce', 'Services', 'Technologie', 'Énergie'],
  administration: ['Municipalité', 'État', 'Hôpital', 'Éducation'],
};
