export { authApi } from "./auth";
export { clientsApi } from "./clients";
export { invoicesApi } from "./invoices";
export { paymentsApi } from "./payments";
export { dashboardApi } from "./dashboard";
export { notificationsApi } from "./notifications";
export { usersApi } from "./users";
export { riskScoringApi } from "./risk-scoring";

export type { SessionUser, LoginPayload } from "./auth";
export type { Client, CreateClientDto, UpdateClientDto } from "./clients";
export type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilters } from "./invoices";
export type { Payment, CreatePaymentDto, UpdatePaymentDto } from "./payments";
export type { Kpis, MonthlySeries, StatusBreakdown } from "./dashboard";
export type { Notification } from "./notifications";
export type { User, CreateUserDto, UpdateUserDto } from "./users";
export type { RiskScore } from "./risk-scoring";

export type { ClientType, InvoiceStatus, RiskCategory } from "@/lib/steg-data";
