import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPlanService,
  deletePlanService,
  getPlansService,
  updatePlanService,
  deactivatePlanService,
} from "../services/planService";
import { CreatePlanDto, UpdatePlanDto } from "../types/plan";
import { sortPlans } from "../utils/sortPlans";

export const usePlans = () => {
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlansService,
    select: sortPlans,
  });

  const createPlan = useMutation({
    mutationFn: (data: CreatePlanDto) => createPlanService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  const updatePlan = useMutation({
    mutationFn: (data: UpdatePlanDto) => updatePlanService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => deletePlanService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  const deactivatePlan = useMutation({
    mutationFn: (id: number) => deactivatePlanService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    deactivatePlan,
  };
};
