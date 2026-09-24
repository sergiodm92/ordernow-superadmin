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
  const { id, ...body } = data;
  const response = await api.put(`/plans/${id}`, body);
  return response.data.data;
};

export const deletePlanService = async (id: number): Promise<void> => {
  await api.delete(`/plans/${id}`);
};

export const deactivatePlanService = async (id: number): Promise<void> => {
  await api.patch(`/plans/${id}/deactivate`);
};
