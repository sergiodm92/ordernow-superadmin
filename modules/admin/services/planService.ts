import api from "@/config/api.axios";
import { CreatePlanDto, Plan, UpdatePlanDto } from "../types/plan";

export const getPlansService = async (): Promise<Plan[]> => {
  const response = await api.get("/plans");
  return response.data.data;
};

export const createPlanService = async (data: CreatePlanDto): Promise<Plan> => {
  const response = await api.post("/plans", data);
  return response.data.data;
};

export const updatePlanService = async (data: UpdatePlanDto): Promise<Plan> => {
  // El tipo de un plan no se cambia: PUT /plans/:id responde 400 ante cualquier propiedad que no
  // conoce, y planType es una. Se saca acá aunque un llamador (o un `any`) lo siga mandando.
  const { id, ...body } = data as UpdatePlanDto & { planType?: unknown };
  delete body.planType;
  const response = await api.put(`/plans/${id}`, body);
  return response.data.data;
};

export const deletePlanService = async (id: number): Promise<void> => {
  await api.delete(`/plans/${id}`);
};

export const deactivatePlanService = async (id: number): Promise<void> => {
  await api.patch(`/plans/${id}/deactivate`);
};
