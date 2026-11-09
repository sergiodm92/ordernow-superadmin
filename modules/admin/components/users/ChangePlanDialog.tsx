"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IUser } from "@/modules/auth/types/user";
import { useAssignPlan } from "../../hooks/useUserSubscriptions";
import type { Plan } from "../../types/plan";
import type { UserSubscription } from "../../types/subscription";
import { mayStillBeBilledByProvider, providerLabel, statusLabel } from "../../utils/subscriptionLabels";

const formatLimit = (value: number) => (value === -1 ? "Ilimitado" : String(value));

interface ChangePlanDialogProps {
  user: IUser;
  /** Los planes que se pueden asignar (los activos). */
  plans: Plan[];
  /** La suscripción guardada del usuario; undefined = todavía no cargó, o tiene la FREE implícita. */
  subscription?: UserSubscription;
}

export function ChangePlanDialog({ user, plans, subscription }: ChangePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // null = no tocó el selector: se muestra el plan que tiene. No se guarda como estado inicial
  // porque la suscripción puede llegar después de montar el diálogo.
  const [choice, setChoice] = useState<string | null>(null);
  const assign = useAssignPlan();

  const currentType = subscription?.plan.planType ?? "FREE";
  const selectedType = choice ?? currentType;
  const selectedPlan = plans.find((plan) => plan.planType === selectedType);
  const billed = mayStillBeBilledByProvider(subscription);
  const unchanged = selectedType === currentType && (subscription?.status ?? "ACTIVE") === "ACTIVE";
  const name = `${user.firstName} ${user.lastName}`.trim();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setChoice(null);
  };

  const handleSubmit = () => {
    assign.mutate(
      { userId: user.id, planType: selectedType },
      {
        onSuccess: () => {
          toast.success(`Plan ${selectedPlan?.displayName ?? selectedType} asignado a ${name}`);
          handleOpenChange(false);
        },
        onError: (error) => {
          // El backend explica el rechazo en español (p. ej. que Stripe o Mercado Pago siguen cobrando).
          const message = isAxiosError(error) ? error.response?.data?.message : undefined;
          toast.error(typeof message === "string" && message ? message : "No se pudo asignar el plan");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Cambiar plan de ${name}`}>
          <Crown className="mr-1 h-4 w-4" />
          Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Cambiar plan de {name}</DialogTitle>
          <DialogDescription>
            Se asigna a mano, sin ningún cobro. Rige para el dueño y para todos los usuarios de sus
            establecimientos, y dura hasta que lo cambies o el usuario contrate uno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">
            Plan actual: <span className="font-medium">{subscription?.plan.displayName ?? currentType}</span>
            {subscription && subscription.status !== "ACTIVE" && (
              <span className="text-muted-foreground"> · {statusLabel(subscription.status)}</span>
            )}
          </p>

          {billed && subscription?.paymentProvider && (
            <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Este usuario tiene una suscripción que cobra {providerLabel(subscription.paymentProvider)}. Tiene que
              cancelarla él mismo antes de poder asignarle un plan a mano.
            </p>
          )}

          <div className="space-y-2">
            <label htmlFor={`plan-${user.id}`} className="text-sm font-medium">
              Nuevo plan
            </label>
            <select
              id={`plan-${user.id}`}
              className="w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-60"
              value={selectedType}
              disabled={billed || assign.isPending}
              onChange={(event) => setChoice(event.target.value)}
            >
              {!selectedPlan && <option value={selectedType}>{selectedType}</option>}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.planType}>
                  {plan.displayName} ({plan.planType})
                </option>
              ))}
            </select>
            {selectedPlan && (
              <p className="text-xs text-muted-foreground">
                Platos: {formatLimit(selectedPlan.maxMenuItems)} · Mesas: {formatLimit(selectedPlan.maxTables)} ·
                Empleados: {formatLimit(selectedPlan.maxEmployees)} · Categorías:{" "}
                {formatLimit(selectedPlan.maxCategories)} · Delivery: {selectedPlan.deliveryEnabled ? "sí" : "no"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={billed || unchanged || assign.isPending}>
            {assign.isPending ? "Asignando..." : "Asignar plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
