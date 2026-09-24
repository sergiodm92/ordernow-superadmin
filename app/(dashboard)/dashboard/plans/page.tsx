"use client";

import { PlansTable } from "@/modules/admin/components/plans/PlansTable";
import { PlanDialog } from "@/modules/admin/components/plans/PlanDialog";
import { usePlans } from "@/modules/admin/hooks/usePlans";
import { Plan } from "@/modules/admin/types/plan";
import { useState, useEffect } from "react";
import { useLoadingStore } from "@/store/loading";

export default function PlansPage() {
  const { plans, isLoading, createPlan, updatePlan, deletePlan } = usePlans();
  const { showLoading, hideLoading } = useLoadingStore();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (isLoading) {
      showLoading('Cargando planes...');
    } else {
      hideLoading();
    }
  }, [isLoading, showLoading, hideLoading]);

  if (isLoading) {
    return null;
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
  };

  const handleUpdatePlan = async (data: any) => {
    if (editingPlan) {
      // UpdatePlanDto doesn't accept planType (immutable after creation) — the backend's
      // whitelist validation 400s if it's present, so strip it here. `active` is stripped too:
      // PlanDto never returns it, so the form can't know the real state and sending the default
      // would silently reactivate a deactivated plan.
      const { planType, active, ...updateFields } = data;
      await updatePlan.mutateAsync({
        id: editingPlan.id,
        ...updateFields,
      });
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    await deletePlan.mutateAsync(planId);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Planes</h2>
        <PlanDialog
          title="Crear Plan"
          onSubmit={async (data) => {
            await createPlan.mutateAsync(data);
          }}
        />
      </div>

      <PlansTable
        plans={plans}
        onEdit={handleEditPlan}
        onDelete={handleDeletePlan}
      />

      {editingPlan && (
        <PlanDialog
          plan={editingPlan}
          title="Editar Plan"
          onSubmit={handleUpdatePlan}
          onClose={() => setEditingPlan(null)}
          trigger={null}
        />
      )}
    </div>
  );
}
