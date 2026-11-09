import type { Plan } from "./plan";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "SUSPENDED";
export type PaymentProvider = "STRIPE" | "MERCADO_PAGO";

/**
 * La suscripción de un usuario, como la devuelve GET /subscriptions/admin/users. Los límites de los
 * establecimientos de un dueño y de quienes trabajan en ellos salen del plan de ESTA suscripción.
 */
export interface UserSubscription {
  /** Ausente solo en la FREE implícita, que este endpoint no devuelve. */
  id?: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  /** null cuando nadie cobra la suscripción: FREE o un plan asignado a mano. */
  paymentProvider?: PaymentProvider | null;
  currentPeriodEnd?: string | null;
  yearlyBilling: boolean;
}
