import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPlanService, getUsersSubscriptionsService } from "../services/subscriptionService";
import type { UserSubscription } from "../types/subscription";

const KEY = "admin-user-subscriptions";

/**
 * La suscripción de cada usuario de `userIds` (los dueños de la página que se está viendo), indexada
 * por id de usuario. Un usuario que no está en el mapa tiene la FREE implícita.
 */
export const useUserSubscriptions = (userIds: string[]) => {
  const ids = Array.from(new Set(userIds)).sort();

  const { data, isLoading, isError } = useQuery({
    queryKey: [KEY, ids],
    queryFn: () => getUsersSubscriptionsService(ids),
    enabled: ids.length > 0,
    select: (subscriptions: UserSubscription[]) => new Map(subscriptions.map((s) => [s.userId, s])),
  });

  return { subscriptions: data ?? new Map<string, UserSubscription>(), isLoading, isError };
};

export const useAssignPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, planType }: { userId: string; planType: string }) => assignPlanService(userId, planType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
};
