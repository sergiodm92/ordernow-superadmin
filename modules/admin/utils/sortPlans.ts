import type { Plan } from "../types/plan";
import { PLAN_TYPES } from "../validations/planValidation";

const tierIndex = (planType: string): number => {
  const index = (PLAN_TYPES as readonly string[]).indexOf(planType);
  return index === -1 ? PLAN_TYPES.length : index;
};

/**
 * Los planes en un orden fijo: FREE, BASIC, PRO, ENTERPRISE (un tipo que no se conoce, al final) y,
 * a igual tipo, por id. `GET /plans` no ordena y Postgres devuelve la fila recién actualizada al
 * final, así que sin esto el plan que se acaba de editar saltaría al fondo de la tabla.
 */
export function sortPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => tierIndex(a.planType) - tierIndex(b.planType) || a.id - b.id);
}
