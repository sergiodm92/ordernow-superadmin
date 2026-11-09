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
  MAX_SUBSCRIPTION_USER_IDS,
  assignPlanService,
  getUsersSubscriptionsService,
} from "@/modules/admin/services/subscriptionService";
import { makeSubscription } from "../../../helpers/subscriptions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUsersSubscriptionsService", () => {
  it("pide todos los ids en una sola llamada, como una lista separada por comas (no como userIds[])", async () => {
    api.get.mockResolvedValue({ data: { success: true, data: [makeSubscription()] } });

    const result = await getUsersSubscriptionsService(["a", "b"]);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/subscriptions/admin/users", { params: { userIds: "a,b" } });
    expect(result).toEqual([makeSubscription()]);
  });

  it("no repite ids", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });

    await getUsersSubscriptionsService(["a", "b", "a"]);

    expect(api.get).toHaveBeenCalledWith("/subscriptions/admin/users", { params: { userIds: "a,b" } });
  });

  it("sin ids no llama al backend: respondería 400", async () => {
    await expect(getUsersSubscriptionsService([])).resolves.toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("no pide más ids de los que admite el backend", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    const ids = Array.from({ length: MAX_SUBSCRIPTION_USER_IDS + 5 }, (_, i) => `user-${i}`);

    await getUsersSubscriptionsService(ids);

    const { userIds } = api.get.mock.calls[0][1].params as { userIds: string };
    expect(userIds.split(",")).toHaveLength(MAX_SUBSCRIPTION_USER_IDS);
  });
});

describe("assignPlanService", () => {
  it("hace PUT al plan del usuario con solo el tipo de plan, y devuelve la suscripción", async () => {
    const granted = makeSubscription({ userId: "user-9" });
    api.put.mockResolvedValue({ data: { success: true, data: granted } });

    const result = await assignPlanService("user-9", "PRO");

    expect(api.put).toHaveBeenCalledWith("/subscriptions/admin/users/user-9/plan", { planType: "PRO" });
    expect(result).toEqual(granted);
  });

  it("deja pasar el error del backend para que quien llama muestre su mensaje", async () => {
    const failure = new Error("409");
    api.put.mockRejectedValue(failure);

    await expect(assignPlanService("user-9", "PRO")).rejects.toBe(failure);
  });
});
