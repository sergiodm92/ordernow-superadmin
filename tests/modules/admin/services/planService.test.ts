import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/config/api.axios", () => ({ default: api }));

import {
  createPlanService,
  deactivatePlanService,
  deletePlanService,
  getPlansService,
  updatePlanService,
} from "@/modules/admin/services/planService";
import type { CreatePlanDto, UpdatePlanDto } from "@/modules/admin/types/plan";

const createDto: CreatePlanDto = {
  planType: "PRO",
  displayName: "Pro",
  description: "Plan profesional",
  maxMenuItems: 500,
  maxTables: -1,
  maxEmployees: 50,
  maxCategories: 100,
  maxOptionGroups: 30,
  maxPromotions: 30,
  deliveryEnabled: true,
  monthlyPriceUsd: 49.99,
  yearlyPriceUsd: 499.9,
  monthlyPriceArs: 29900,
  yearlyPriceArs: null,
  active: true,
};

const savedPlan = { id: 3, ...createDto };

beforeEach(() => {
  vi.clearAllMocks();
  api.put.mockResolvedValue({ data: { success: true, data: savedPlan } });
  api.post.mockResolvedValue({ data: { success: true, data: savedPlan } });
});

describe("updatePlanService", () => {
  const { planType: _planType, ...updateFields } = createDto;
  const update: UpdatePlanDto = { id: 3, ...updateFields };

  it("hace PUT /plans/:id con el id en la URL y fuera del cuerpo", async () => {
    await updatePlanService(update);

    expect(api.put).toHaveBeenCalledTimes(1);
    const [url, body] = api.put.mock.calls[0];
    expect(url).toBe("/plans/3");
    expect(body).not.toHaveProperty("id");
    expect(body).toEqual(updateFields);
  });

  it("nunca manda planType: el backend rechaza con 400 las propiedades que no conoce", async () => {
    // Un llamador viejo (o un `any`) puede seguir pasándolo: el servicio lo saca igual.
    await updatePlanService({ ...update, planType: "PRO" } as UpdatePlanDto);

    const [, body] = api.put.mock.calls[0];
    expect(body).not.toHaveProperty("planType");
    expect(Object.keys(body)).not.toContain("planType");
  });

  it("no modifica el objeto que recibe", async () => {
    const input = { ...update, planType: "PRO" } as UpdatePlanDto;
    await updatePlanService(input);

    expect(input).toHaveProperty("id", 3);
    expect(input).toHaveProperty("planType", "PRO");
  });

  it("manda null en un precio ARS para borrarlo, y los demás campos tal cual", async () => {
    await updatePlanService({ id: 3, monthlyPriceArs: null, active: false });

    const [, body] = api.put.mock.calls[0];
    expect(body).toEqual({ monthlyPriceArs: null, active: false });
  });

  it("devuelve el plan del sobre { data } de la respuesta", async () => {
    await expect(updatePlanService(update)).resolves.toEqual(savedPlan);
  });
});

describe("createPlanService", () => {
  it("hace POST /plans con planType incluido", async () => {
    const result = await createPlanService(createDto);

    expect(api.post).toHaveBeenCalledWith("/plans", createDto);
    expect(api.post.mock.calls[0][1]).toHaveProperty("planType", "PRO");
    expect(result).toEqual(savedPlan);
  });
});

describe("el resto de los servicios de planes sigue igual", () => {
  it("getPlansService lista con GET /plans", async () => {
    api.get.mockResolvedValue({ data: { data: [savedPlan] } });

    await expect(getPlansService()).resolves.toEqual([savedPlan]);
    expect(api.get).toHaveBeenCalledWith("/plans");
  });

  it("deletePlanService hace DELETE /plans/:id", async () => {
    api.delete.mockResolvedValue({});

    await deletePlanService(7);
    expect(api.delete).toHaveBeenCalledWith("/plans/7");
  });

  it("deactivatePlanService hace PATCH /plans/:id/deactivate", async () => {
    api.patch.mockResolvedValue({});

    await deactivatePlanService(7);
    expect(api.patch).toHaveBeenCalledWith("/plans/7/deactivate");
  });
});
