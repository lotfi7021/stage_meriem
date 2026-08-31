import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { rateLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import clientsRoutes from './routes/clients';
import invoicesRoutes from './routes/invoices';
import paymentsRoutes from './routes/payments';
import dashboardRoutes from './routes/dashboard';
import notificationsRoutes from './routes/notifications';
import riskScoringRoutes from './routes/risk-scoring';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/clients', clientsRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/payments', paymentsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/risk-scores', riskScoringRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log('STEG Insight API running on http://localhost:' + PORT);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
