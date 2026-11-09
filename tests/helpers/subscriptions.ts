import type { UserSubscription } from "@/modules/admin/types/subscription";
import { makePlan } from "./plans";

/** Una suscripción como la devuelve GET /subscriptions/admin/users: por defecto, un plan Pro cobrado por nadie. */
export const makeSubscription = (overrides: Partial<UserSubscription> = {}): UserSubscription => ({
  id: "6f1c2b8e-4d3a-4f5b-9c7e-2a1b3c4d5e6f",
  userId: "user-1",
  plan: makePlan(),
  status: "ACTIVE",
  paymentProvider: null,
  currentPeriodEnd: "2126-11-09T12:00:00.000Z",
  yearlyBilling: false,
  ...overrides,
});
