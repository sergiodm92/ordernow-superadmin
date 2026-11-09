import type { PaymentProvider, SubscriptionStatus, UserSubscription } from "../types/subscription";

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Activo",
  PAST_DUE: "Pago vencido",
  CANCELED: "Cancelado",
  SUSPENDED: "Suspendido",
  EXPIRED: "Vencido",
};

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: "Stripe",
  MERCADO_PAGO: "Mercado Pago",
};

export const statusLabel = (status: string): string => STATUS_LABELS[status as SubscriptionStatus] ?? status;

export const providerLabel = (provider: string): string => PROVIDER_LABELS[provider as PaymentProvider] ?? provider;

/**
 * Lo mismo que decide el backend para responder 409: la suscripción nombra un proveedor y no está
 * CANCELED, así que Stripe o Mercado Pago todavía pueden cobrarle (PAST_DUE y SUSPENDED incluidos).
 * Sirve para avisar antes de intentar; la última palabra la tiene el backend.
 */
export const mayStillBeBilledByProvider = (subscription?: Pick<UserSubscription, "paymentProvider" | "status">): boolean =>
  !!subscription?.paymentProvider && subscription.status !== "CANCELED";
