import { beforeEach, describe, expect, it, vi } from "vitest";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Con los diálogos de Radix en jsdom, en frío o con la máquina cargada, 1 s de espera se queda corto.
vi.setConfig({ testTimeout: 30_000 });
configure({ asyncUtilTimeout: 5000 });

const service = vi.hoisted(() => ({
  assignPlanService: vi.fn(),
  getUsersSubscriptionsService: vi.fn(),
}));
vi.mock("@/modules/admin/services/subscriptionService", () => service);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { ChangePlanDialog } from "@/modules/admin/components/users/ChangePlanDialog";
import type { IUser } from "@/modules/auth/types/user";
import { makePlan } from "../../../../helpers/plans";
import { makeSubscription } from "../../../../helpers/subscriptions";

const user = { id: "user-1", firstName: "Ana", lastName: "García", email: "ana@example.com", roles: [], createdAt: "" } as IUser;

const free = makePlan({ id: 1, planType: "FREE", displayName: "Free", maxTables: 5, deliveryEnabled: false });
const pro = makePlan({ id: 3, planType: "PRO", displayName: "Pro", maxTables: 100 });
const enterprise = makePlan({ id: 4, planType: "ENTERPRISE", displayName: "Enterprise", maxTables: -1 });
const plans = [free, pro, enterprise];

const renderDialog = (subscription = makeSubscription({ plan: free })) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChangePlanDialog user={user} plans={plans} subscription={subscription} />
    </QueryClientProvider>
  );
  return userEvent.setup();
};

const open = (ui: ReturnType<typeof userEvent.setup>) => ui.click(screen.getByRole("button", { name: /Cambiar plan de Ana García/ }));
const submitButton = () => screen.getByRole("button", { name: "Asignar plan" });
const selector = () => screen.getByLabelText("Nuevo plan") as HTMLSelectElement;

beforeEach(() => {
  vi.clearAllMocks();
  service.assignPlanService.mockResolvedValue(makeSubscription());
});

describe("ChangePlanDialog", () => {
  it("muestra el plan actual y los límites del plan elegido, y no deja asignar el mismo plan", async () => {
    const ui = renderDialog();
    await open(ui);

    expect(screen.getByText("Free", { selector: "span.font-medium" })).toBeInTheDocument();
    expect(selector().value).toBe("FREE");
    expect(screen.getByText(/Mesas: 5/)).toBeInTheDocument();
    expect(screen.getByText(/Delivery: no/)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("asigna el plan elegido al usuario de la fila, avisa y cierra el diálogo", async () => {
    const ui = renderDialog();
    await open(ui);

    await ui.selectOptions(selector(), "PRO");
    expect(screen.getByText(/Mesas: 100/)).toBeInTheDocument();
    await ui.click(submitButton());

    await waitFor(() => expect(service.assignPlanService).toHaveBeenCalledWith("user-1", "PRO"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Plan Pro asignado a Ana García"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("muestra los límites ilimitados como Ilimitado, no como -1", async () => {
    const ui = renderDialog();
    await open(ui);

    await ui.selectOptions(selector(), "ENTERPRISE");

    expect(screen.getByText(/Mesas: Ilimitado/)).toBeInTheDocument();
  });

  it.each([
    ["STRIPE", "Stripe"],
    ["MERCADO_PAGO", "Mercado Pago"],
  ] as const)(
    "si %s puede seguir cobrando avisa, y no deja asignar nada (el backend respondería 409)",
    async (paymentProvider, label) => {
      const ui = renderDialog(makeSubscription({ plan: pro, paymentProvider, status: "ACTIVE" }));
      await open(ui);

      expect(screen.getByRole("alert")).toHaveTextContent(`cobra ${label}`);
      expect(selector()).toBeDisabled();
      expect(submitButton()).toBeDisabled();
      expect(service.assignPlanService).not.toHaveBeenCalled();
    }
  );

  it("una suscripción CANCELED de un proveedor sí se puede reemplazar", async () => {
    const ui = renderDialog(makeSubscription({ plan: pro, paymentProvider: "MERCADO_PAGO", status: "CANCELED" }));
    await open(ui);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/Cancelado/)).toBeInTheDocument();
    await ui.selectOptions(selector(), "FREE");
    await ui.click(submitButton());

    await waitFor(() => expect(service.assignPlanService).toHaveBeenCalledWith("user-1", "FREE"));
  });

  it("un usuario sin suscripción guardada parte de FREE", async () => {
    const ui = renderDialog(undefined as never);
    await open(ui);

    expect(selector().value).toBe("FREE");
    await ui.selectOptions(selector(), "PRO");
    await ui.click(submitButton());

    await waitFor(() => expect(service.assignPlanService).toHaveBeenCalledWith("user-1", "PRO"));
  });

  it("si el backend rechaza, muestra su mensaje y deja el diálogo abierto", async () => {
    const message = "El usuario tiene una suscripción que cobra Stripe. Tiene que cancelarla él mismo antes de poder asignarle un plan a mano.";
    service.assignPlanService.mockRejectedValue(
      new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: {} as never,
        data: { code: "SUBSCRIPTION_BILLED_BY_PROVIDER", message },
      })
    );
    const ui = renderDialog();
    await open(ui);

    await ui.selectOptions(selector(), "PRO");
    await ui.click(submitButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("si el error no trae mensaje, muestra uno genérico", async () => {
    service.assignPlanService.mockRejectedValue(new Error("network"));
    const ui = renderDialog();
    await open(ui);

    await ui.selectOptions(selector(), "PRO");
    await ui.click(submitButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo asignar el plan"));
  });

  it("al cerrar y volver a abrir, el selector vuelve al plan que el usuario tiene", async () => {
    const ui = renderDialog();
    await open(ui);
    await ui.selectOptions(selector(), "PRO");

    await ui.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await open(ui);

    expect(selector().value).toBe("FREE");
  });
});
