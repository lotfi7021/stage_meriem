import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { UserEntity } from './entities/user.entity';
import { ClientEntity } from './entities/client.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { PaymentEntity } from './entities/payment.entity';
import { computeInvoiceStatus } from './utils/invoice-status';

dotenv.config();

async function seed() {
  await AppDataSource.initialize();

  const usersRepo = AppDataSource.getRepository(UserEntity);
  const clientsRepo = AppDataSource.getRepository(ClientEntity);
  const invoicesRepo = AppDataSource.getRepository(InvoiceEntity);
  const paymentsRepo = AppDataSource.getRepository(PaymentEntity);

  const users = [
    { nom: 'Admin STEG', email: 'admin@steg.com.tn', motDePasse: 'admin1234', role: 'admin' as const },
    { nom: 'Agent STEG', email: 'agent@steg.com.tn', motDePasse: 'agent1234', role: 'agent' as const },
  ];
  for (const u of users) {
    const exists = await usersRepo.findOne({ where: { email: u.email } });
    if (!exists) {
      await usersRepo.save(
        usersRepo.create({
          nom: u.nom,
          email: u.email,
          role: u.role,
          motDePasseHash: await bcrypt.hash(u.motDePasse, 10),
        }),
      );
    }
  }

  const clients = [
    {
      id: 'CLI-00001',
      nom: 'Groupe Chimique Tunisien',
      type: 'entreprise' as const,
      secteur: 'Industrie',
      adresse: '45 Av. Habib Bourguiba, Tunis',
      ancienneteMois: 96,
      retardsPasses: 3,
      delaiMoyenJours: 28,
    },
 
  ];
  for (const c of clients) {
    const exists = await clientsRepo.findOne({ where: { id: c.id } });
    if (!exists) await clientsRepo.save(clientsRepo.create(c));
  }

  const invoicesData = [
    {
      id: 'FAC-00001',
      clientId: 'CLI-00001',
      montant: 4500,
      dateEmission: '2026-06-10',
      dateEcheance: '2026-07-10',
      montantPaye: 1500,
    },
    
  ];
  for (const i of invoicesData) {
    const exists = await invoicesRepo.findOne({ where: { id: i.id } });
    if (!exists) {
      const statut = computeInvoiceStatus(i.montant, i.montantPaye, i.dateEcheance);
      await invoicesRepo.save(invoicesRepo.create({ ...i, statut }));
    }
  }

  const paymentsData = [
    { id: 'PAY-00001', factureId: 'FAC-00001', montant: 1500, datePaiement: '2026-07-05', methode: 'virement' as const },
  ];
  for (const p of paymentsData) {
    const exists = await paymentsRepo.findOne({ where: { id: p.id } });
    if (!exists) await paymentsRepo.save(paymentsRepo.create(p));
  }

  console.log('Seed termine. Comptes de demo:');
  console.log('  admin@steg.com.tn (admin1234)');
  console.log('  agent@steg.com.tn (agent1234)');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
