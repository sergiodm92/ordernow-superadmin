import { Schemas } from "@/types/api";

// Mirrors the backend's PlanDto. NOTE: PlanDto intentionally omits `active` (faithful port of
// Spring's PlanDTO — see plan.mapper.ts) even though CreatePlanDto/UpdatePlanDto accept it as
// input. Any GET /plans response has no `active` field — don't read plan.active.
export type Plan = Schemas["PlanDto"];
export type CreatePlanDto = Schemas["CreatePlanDto"];
export type UpdatePlanDto = Schemas["UpdatePlanDto"] & { id: number };
