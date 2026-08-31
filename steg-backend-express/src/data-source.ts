import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './entities/user.entity';
import { ClientEntity } from './entities/client.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { PaymentEntity } from './entities/payment.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'steg',
  password: process.env.DB_PASSWORD ?? 'steg',
  database: process.env.DB_DATABASE ?? 'steg_insight',
  entities: [UserEntity, ClientEntity, InvoiceEntity, PaymentEntity],
  synchronize: process.env.NODE_ENV !== 'production',
});
