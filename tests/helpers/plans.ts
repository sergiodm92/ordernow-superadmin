import type { Plan } from "@/modules/admin/types/plan";

/** Un plan como lo devuelve GET /plans del backend actual (con precios ARS y `active`). */
export const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 3,
  planType: "PRO",
  displayName: "Pro",
  description: "Plan profesional",
  maxMenuItems: 500,
  maxTables: 100,
  maxEmployees: 50,
  maxCategories: 100,
  maxOptionGroups: 30,
  maxPromotions: 30,
  deliveryEnabled: true,
  monthlyPriceUsd: 9.99,
  yearlyPriceUsd: 99.9,
  monthlyPriceArs: 29900,
  yearlyPriceArs: 299000,
  active: true,
  createdAt: "2026-03-14T09:30:00.000Z",
  updatedAt: "2026-10-26T15:00:00.000Z",
  ...overrides,
});
