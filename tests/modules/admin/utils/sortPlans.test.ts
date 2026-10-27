import { describe, expect, it } from "vitest";
import { sortPlans } from "@/modules/admin/utils/sortPlans";
import { makePlan } from "../../../helpers/plans";

const types = (plans: { planType: string }[]) => plans.map((plan) => plan.planType);

describe("sortPlans", () => {
  it("ordena por nivel: FREE, BASIC, PRO, ENTERPRISE", () => {
    const sorted = sortPlans([
      makePlan({ id: 4, planType: "ENTERPRISE" }),
      makePlan({ id: 2, planType: "BASIC" }),
      makePlan({ id: 3, planType: "PRO" }),
      makePlan({ id: 1, planType: "FREE" }),
    ]);

    expect(types(sorted)).toEqual(["FREE", "BASIC", "PRO", "ENTERPRISE"]);
  });

  it("no depende del id: un plan recreado (id más alto) sigue en su lugar", () => {
    const sorted = sortPlans([
      makePlan({ id: 1, planType: "FREE" }),
      makePlan({ id: 9, planType: "BASIC" }),
      makePlan({ id: 3, planType: "PRO" }),
    ]);

    expect(types(sorted)).toEqual(["FREE", "BASIC", "PRO"]);
  });

  it("con el mismo tipo, por id", () => {
    const sorted = sortPlans([
      makePlan({ id: 8, planType: "PRO" }),
      makePlan({ id: 5, planType: "PRO" }),
    ]);

    expect(sorted.map((plan) => plan.id)).toEqual([5, 8]);
  });

  it("un tipo que no se conoce va al final, entre sí por id", () => {
    const sorted = sortPlans([
      makePlan({ id: 7, planType: "LEGACY" }),
      makePlan({ id: 6, planType: "OTHER" }),
      makePlan({ id: 1, planType: "FREE" }),
    ]);

    expect(sorted.map((plan) => plan.id)).toEqual([1, 6, 7]);
  });

  it("no modifica la lista que recibe", () => {
    const plans = [makePlan({ id: 2, planType: "PRO" }), makePlan({ id: 1, planType: "FREE" })];

    sortPlans(plans);

    expect(plans.map((plan) => plan.id)).toEqual([2, 1]);
  });

  it("una lista vacía queda vacía", () => {
    expect(sortPlans([])).toEqual([]);
  });
});
