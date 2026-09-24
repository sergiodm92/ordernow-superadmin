import api from "@/config/api.axios";
import { ApiData } from "@/types/api";
import { CreatePlanDto, Plan, UpdatePlanDto } from "../types/plan";

export const getPlansService = async (): Promise<Plan[]> => {
  const response = await api.get<{ data: ApiData<"/api/v1/plans", "get"> }>("/plans");
  return response.data.data;
};

export const createPlanService = async (data: CreatePlanDto): Promise<Plan> => {
  const response = await api.post<{ data: ApiData<"/api/v1/plans", "post"> }>("/plans", data);
  return response.data.data;
};

export const updatePlanService = async (data: UpdatePlanDto): Promise<Plan> => {
  const { id, ...body } = data;
  const response = await api.put<{ data: ApiData<"/api/v1/plans/{id}", "put"> }>(`/plans/${id}`, body);
  return response.data.data;
};

// DELETE and PATCH /deactivate both respond 204 (no body) — nothing to return.
export const deletePlanService = async (id: number): Promise<void> => {
  await api.delete(`/plans/${id}`);
};

export const deactivatePlanService = async (id: number): Promise<void> => {
  await api.patch(`/plans/${id}/deactivate`);
};
