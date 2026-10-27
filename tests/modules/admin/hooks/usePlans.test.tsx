import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const services = vi.hoisted(() => ({
  getPlansService: vi.fn(),
  createPlanService: vi.fn(),
  updatePlanService: vi.fn(),
  deletePlanService: vi.fn(),
  deactivatePlanService: vi.fn(),
}));

vi.mock("@/modules/admin/services/planService", () => services);

import { usePlans } from "@/modules/admin/hooks/usePlans";
import { makePlan } from "../../../helpers/plans";

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePlans", () => {
  // GET /plans no ordena y Postgres devuelve la fila recién actualizada al final: sin orden fijo,
  // el plan que se acaba de editar saltaba al fondo de la tabla.
  it("entrega los planes en orden FREE, BASIC, PRO, ENTERPRISE, venga como venga del backend", async () => {
    services.getPlansService.mockResolvedValue([
      makePlan({ id: 2, planType: "BASIC" }),
      makePlan({ id: 3, planType: "PRO" }),
      makePlan({ id: 4, planType: "ENTERPRISE" }),
      makePlan({ id: 1, planType: "FREE" }),
    ]);

    const { result } = renderHook(() => usePlans(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans.map((plan) => plan.planType)).toEqual([
      "FREE",
      "BASIC",
      "PRO",
      "ENTERPRISE",
    ]);
  });

  it("mientras carga, la lista está vacía", () => {
    services.getPlansService.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePlans(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.plans).toEqual([]);
  });
});
