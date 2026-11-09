import api from "@/config/api.axios";
import type { UserSubscription } from "../types/subscription";

/** Cuántos usuarios admite GET /subscriptions/admin/users por llamada. */
export const MAX_SUBSCRIPTION_USER_IDS = 100;

/**
 * La suscripción guardada de cada usuario pedido. Un usuario sin suscripción guardada (FREE
 * implícita) no viene en la respuesta: quien llama lo trata como FREE.
 */
export const getUsersSubscriptionsService = async (userIds: string[]): Promise<UserSubscription[]> => {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return [];
  // Una sola lista separada por comas: axios serializaría un array como `userIds[]=…`, que el backend no lee.
  const response = await api.get("/subscriptions/admin/users", {
    params: { userIds: unique.slice(0, MAX_SUBSCRIPTION_USER_IDS).join(",") },
  });
  return response.data.data;
};

/**
 * Le asigna a mano un plan al usuario, sin cobro. Responde 409 `SUBSCRIPTION_BILLED_BY_PROVIDER`
 * mientras Stripe o Mercado Pago puedan seguir cobrándole: el usuario tiene que cancelar primero.
 */
export const assignPlanService = async (userId: string, planType: string): Promise<UserSubscription> => {
  const response = await api.put(`/subscriptions/admin/users/${userId}/plan`, { planType });
  return response.data.data;
};
