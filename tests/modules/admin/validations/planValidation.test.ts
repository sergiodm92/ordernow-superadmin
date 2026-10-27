import { describe, expect, it } from "vitest";
import {
  ARS_PRICE_MESSAGES,
  LIMIT_MESSAGES,
  MAX_ARS_PRICE,
  MAX_PLAN_LIMIT,
  MAX_USD_PRICE,
  PLAN_DESCRIPTION_MAX_LENGTH,
  PLAN_DISPLAY_NAME_MAX_LENGTH,
  type PlanFormValues,
  USD_PRICE_MESSAGES,
  buildCreatePlanPayload,
  buildUpdatePlanPayload,
  createPlanSchema,
  editPlanSchema,
  getArsPriceError,
  getPlanFormDefaults,
  getPlanFormSchema,
  parseArsPriceInput,
} from "@/modules/admin/validations/planValidation";
import { makePlan } from "../../../helpers/plans";

const makeValues = (overrides: Partial<PlanFormValues> = {}): PlanFormValues => ({
  ...getPlanFormDefaults(),
  planType: "PRO",
  displayName: "Pro",
  description: "Plan profesional",
  ...overrides,
});

/** Mensajes de error de un parseo, por campo. */
const errorsOf = (
  schema: ReturnType<typeof getPlanFormSchema>,
  values: unknown
): Record<string, string> => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("parseArsPriceInput", () => {
  it("lee los dígitos como pesos enteros", () => {
    expect(parseArsPriceInput("49900")).toBe(49900);
    expect(parseArsPriceInput("1")).toBe(1);
    expect(parseArsPriceInput("0050000")).toBe(50000);
  });

  it("ignora los espacios de los costados", () => {
    expect(parseArsPriceInput("  49900 ")).toBe(49900);
  });

  it("vacío o solo espacios es null: sin precio", () => {
    expect(parseArsPriceInput("")).toBeNull();
    expect(parseArsPriceInput("   ")).toBeNull();
  });

  // Con type=number, "50.000" se leía 50: el punto o la coma de miles se tomaba por decimal.
  it.each(["50.000", "1.000.000", "10,000", "50.000,00", "49.5", "$ 50.000", "-500", "1e3", "12 000", "abc"])(
    "devuelve NaN para %s en vez de adivinar qué quiso decir el punto o la coma",
    (text) => {
      expect(parseArsPriceInput(text)).toBeNaN();
    }
  );
});

describe("getArsPriceError", () => {
  it("no marca error en un precio válido ni en un campo vacío", () => {
    expect(getArsPriceError("49900")).toBeUndefined();
    expect(getArsPriceError("")).toBeUndefined();
    expect(getArsPriceError(String(MAX_ARS_PRICE))).toBeUndefined();
  });

  it("explica cada caso con su mensaje", () => {
    expect(getArsPriceError("50.000")).toBe(ARS_PRICE_MESSAGES.format);
    expect(getArsPriceError("0")).toBe(ARS_PRICE_MESSAGES.min);
    expect(getArsPriceError(String(MAX_ARS_PRICE + 1))).toBe(ARS_PRICE_MESSAGES.max);
  });

  it("un número larguísimo no pasa por 'válido' ni revienta", () => {
    expect(getArsPriceError("9".repeat(400))).toBe(ARS_PRICE_MESSAGES.max);
  });
});

describe("precios en ARS del esquema", () => {
  it("acepta un entero de 1 en adelante, escrito solo con dígitos", () => {
    for (const price of ["1", "29900", "299000", String(MAX_ARS_PRICE)]) {
      expect(
        createPlanSchema.safeParse(makeValues({ monthlyPriceArs: price, yearlyPriceArs: price })).success
      ).toBe(true);
    }
  });

  it("acepta el campo vacío: vacío significa sin precio", () => {
    const result = createPlanSchema.safeParse(makeValues({ monthlyPriceArs: "", yearlyPriceArs: "" }));
    expect(result.success).toBe(true);
  });

  it("rechaza los decimales con un mensaje claro", () => {
    const errors = errorsOf(createPlanSchema, makeValues({ monthlyPriceArs: "49.5" }));
    expect(errors.monthlyPriceArs).toBe(ARS_PRICE_MESSAGES.format);
    expect(errors.monthlyPriceArs).toMatch(/número entero de pesos/);
  });

  it("rechaza los puntos y comas de miles, que un type=number leería como decimales", () => {
    for (const text of ["50.000", "1.000.000", "10,000", "$ 50.000"]) {
      const errors = errorsOf(createPlanSchema, makeValues({ yearlyPriceArs: text }));
      expect(errors.yearlyPriceArs, text).toBe(ARS_PRICE_MESSAGES.format);
    }
    expect(ARS_PRICE_MESSAGES.format).toMatch(/sin puntos, comas ni símbolos/);
  });

  it("rechaza 0 con el mensaje del mínimo y los negativos con el del formato", () => {
    expect(errorsOf(createPlanSchema, makeValues({ yearlyPriceArs: "0" })).yearlyPriceArs).toBe(
      ARS_PRICE_MESSAGES.min
    );
    for (const text of ["-1", "-29900"]) {
      expect(errorsOf(createPlanSchema, makeValues({ yearlyPriceArs: text })).yearlyPriceArs).toBe(
        ARS_PRICE_MESSAGES.format
      );
    }
    expect(ARS_PRICE_MESSAGES.min).toMatch(/\$ 1 o más/);
  });

  it("el tope es el del backend: 99.999.999 pesos", () => {
    expect(MAX_ARS_PRICE).toBe(99_999_999);
    const errors = errorsOf(createPlanSchema, makeValues({ monthlyPriceArs: String(MAX_ARS_PRICE + 1) }));
    expect(errors.monthlyPriceArs).toBe(ARS_PRICE_MESSAGES.max);
    expect(ARS_PRICE_MESSAGES.max).toContain("$ 99.999.999");
  });

  it("rechaza lo que no es texto, en español", () => {
    expect(errorsOf(createPlanSchema, { ...makeValues(), monthlyPriceArs: 29900 }).monthlyPriceArs).toBe(
      ARS_PRICE_MESSAGES.format
    );
    expect(errorsOf(createPlanSchema, { ...makeValues(), yearlyPriceArs: undefined }).yearlyPriceArs).toBe(
      ARS_PRICE_MESSAGES.format
    );
    expect(errorsOf(createPlanSchema, { ...makeValues(), yearlyPriceArs: null }).yearlyPriceArs).toBe(
      ARS_PRICE_MESSAGES.format
    );
  });

  it("valida cada ciclo por separado", () => {
    const errors = errorsOf(
      createPlanSchema,
      makeValues({ monthlyPriceArs: "29900", yearlyPriceArs: "0" })
    );
    expect(errors).toHaveProperty("yearlyPriceArs");
    expect(errors).not.toHaveProperty("monthlyPriceArs");
  });
});

describe("precios en USD del esquema", () => {
  it("acepta de 0 hasta lo que entra en la base de datos", () => {
    for (const price of [0, 9.99, MAX_USD_PRICE]) {
      expect(
        createPlanSchema.safeParse(makeValues({ monthlyPriceUsd: price, yearlyPriceUsd: price })).success
      ).toBe(true);
    }
  });

  it("rechaza más de lo que entra en la base de datos (numeric(10,2))", () => {
    const errors = errorsOf(createPlanSchema, makeValues({ yearlyPriceUsd: 100_000_000 }));
    expect(errors.yearlyPriceUsd).toBe(USD_PRICE_MESSAGES.max);
    expect(USD_PRICE_MESSAGES.max).toContain("99999999.99");
  });

  it("un precio vacío (null) o que no es número se rechaza en español, no se toma por 0", () => {
    for (const value of [null, undefined, Number.NaN, "9.99"]) {
      const errors = errorsOf(createPlanSchema, { ...makeValues(), monthlyPriceUsd: value });
      expect(errors.monthlyPriceUsd, String(value)).toBe(USD_PRICE_MESSAGES.required);
    }
  });
});

describe("límites del esquema", () => {
  it("acepta 0, un número y el máximo que entra en la base de datos", () => {
    for (const limit of [0, 12, MAX_PLAN_LIMIT]) {
      expect(createPlanSchema.safeParse(makeValues({ maxMenuItems: limit })).success).toBe(true);
    }
  });

  it("rechaza un límite vacío (null) con un mensaje que sugiere el tilde Ilimitado", () => {
    expect(errorsOf(createPlanSchema, makeValues({ maxTables: null })).maxTables).toBe(
      LIMIT_MESSAGES.required
    );
    expect(LIMIT_MESSAGES.required).toMatch(/Ilimitado/);
  });

  it("rechaza los decimales, los negativos y lo que no entra en un int", () => {
    expect(errorsOf(createPlanSchema, makeValues({ maxEmployees: 2.5 })).maxEmployees).toBe(
      LIMIT_MESSAGES.integer
    );
    expect(errorsOf(createPlanSchema, makeValues({ maxEmployees: -1 })).maxEmployees).toBe(
      LIMIT_MESSAGES.min
    );
    expect(errorsOf(createPlanSchema, makeValues({ maxCategories: MAX_PLAN_LIMIT + 1 })).maxCategories).toBe(
      LIMIT_MESSAGES.max
    );
    expect(LIMIT_MESSAGES.max).toContain("2.147.483.647");
  });

  it("rechaza lo que no es número, en español", () => {
    for (const value of [undefined, Number.NaN, "5"]) {
      const errors = errorsOf(createPlanSchema, { ...makeValues(), maxPromotions: value });
      expect(errors.maxPromotions, String(value)).toBe(LIMIT_MESSAGES.required);
    }
  });

  it("con el tilde Ilimitado no se valida el número (no se ve ni se manda)", () => {
    const values = makeValues({
      maxMenuItems: null,
      unlimitedMenuItems: true,
      maxTables: -7,
      unlimitedTables: true,
      maxEmployees: 2.5,
      unlimitedEmployees: true,
    });
    expect(createPlanSchema.safeParse(values).success).toBe(true);
    expect(editPlanSchema.safeParse(values).success).toBe(true);
  });

  it("el error de un límite cae en el campo de ese límite", () => {
    const errors = errorsOf(
      createPlanSchema,
      makeValues({ maxOptionGroups: null, maxMenuItems: 4, unlimitedPromotions: true, maxPromotions: null })
    );
    expect(Object.keys(errors)).toEqual(["maxOptionGroups"]);
  });

  it("también se valida en la edición", () => {
    expect(errorsOf(getPlanFormSchema("edit"), makeValues({ maxTables: null })).maxTables).toBe(
      LIMIT_MESSAGES.required
    );
  });
});

describe("descripción y nombre del esquema", () => {
  it("acepta una descripción de exactamente 255 caracteres", () => {
    const description = "a".repeat(PLAN_DESCRIPTION_MAX_LENGTH);
    expect(PLAN_DESCRIPTION_MAX_LENGTH).toBe(255);
    expect(createPlanSchema.safeParse(makeValues({ description })).success).toBe(true);
  });

  it("rechaza 256 caracteres con un mensaje que dice el límite", () => {
    const errors = errorsOf(
      createPlanSchema,
      makeValues({ description: "a".repeat(PLAN_DESCRIPTION_MAX_LENGTH + 1) })
    );
    expect(errors.description).toBe("La descripción no puede superar los 255 caracteres");
  });

  it("sigue exigiendo descripción y nombre", () => {
    const errors = errorsOf(createPlanSchema, makeValues({ description: "", displayName: "" }));
    expect(errors.description).toBe("La descripción es requerida");
    expect(errors.displayName).toBe("El nombre es requerido");
  });

  it("limita el nombre a 100 caracteres, como el backend", () => {
    expect(
      createPlanSchema.safeParse(
        makeValues({ displayName: "n".repeat(PLAN_DISPLAY_NAME_MAX_LENGTH) })
      ).success
    ).toBe(true);
    expect(
      errorsOf(createPlanSchema, makeValues({ displayName: "n".repeat(PLAN_DISPLAY_NAME_MAX_LENGTH + 1) }))
        .displayName
    ).toBe("El nombre no puede superar los 100 caracteres");
  });

  it("mantiene la validación de los precios en USD", () => {
    const errors = errorsOf(createPlanSchema, makeValues({ monthlyPriceUsd: -1 }));
    expect(errors.monthlyPriceUsd).toBe("El precio debe ser mayor o igual a 0");
    expect(USD_PRICE_MESSAGES.min).toBe("El precio debe ser mayor o igual a 0");
  });
});

describe("tipo de plan: obligatorio al crear, ignorado al editar", () => {
  it("al crear exige el tipo", () => {
    const errors = errorsOf(getPlanFormSchema("create"), makeValues({ planType: "" }));
    expect(errors.planType).toBe("El tipo de plan es requerido");
  });

  it("al editar no lo exige", () => {
    expect(getPlanFormSchema("edit")).toBe(editPlanSchema);
    expect(editPlanSchema.safeParse(makeValues({ planType: "" })).success).toBe(true);
  });
});

describe("getPlanFormDefaults", () => {
  it("en el alta arranca vacío y activo (como crea el backend)", () => {
    const defaults = getPlanFormDefaults();

    expect(defaults).toMatchObject({
      planType: "",
      displayName: "",
      description: "",
      monthlyPriceArs: "",
      yearlyPriceArs: "",
      monthlyPriceUsd: 0,
      yearlyPriceUsd: 0,
      deliveryEnabled: false,
      active: true,
    });
    expect(defaults.unlimitedMenuItems).toBe(false);
    expect(defaults.maxMenuItems).toBe(0);
  });

  it("en la edición toma todo del plan, incluidos los precios ARS", () => {
    const defaults = getPlanFormDefaults(makePlan());

    expect(defaults).toMatchObject({
      planType: "PRO",
      displayName: "Pro",
      description: "Plan profesional",
      maxMenuItems: 500,
      monthlyPriceUsd: 9.99,
      yearlyPriceUsd: 99.9,
      monthlyPriceArs: "29900",
      yearlyPriceArs: "299000",
      deliveryEnabled: true,
      active: true,
    });
  });

  it("un plan sin precio ARS queda con el campo vacío en el formulario", () => {
    const defaults = getPlanFormDefaults(makePlan({ monthlyPriceArs: null, yearlyPriceArs: null }));
    expect(defaults.monthlyPriceArs).toBe("");
    expect(defaults.yearlyPriceArs).toBe("");
  });

  it("-1 en un límite se muestra como ilimitado con el número en 0", () => {
    const defaults = getPlanFormDefaults(makePlan({ maxTables: -1, maxPromotions: -1 }));

    expect(defaults.unlimitedTables).toBe(true);
    expect(defaults.maxTables).toBe(0);
    expect(defaults.unlimitedPromotions).toBe(true);
    expect(defaults.maxPromotions).toBe(0);
    expect(defaults.unlimitedMenuItems).toBe(false);
    expect(defaults.maxMenuItems).toBe(500);
  });

  it("`active` viene del plan: un plan inactivo no se reactiva solo", () => {
    expect(getPlanFormDefaults(makePlan({ active: false })).active).toBe(false);
    expect(getPlanFormDefaults(makePlan({ active: true })).active).toBe(true);
  });

  it("un plan sin dato de `active` no se convierte en activo ni en inactivo", () => {
    expect(getPlanFormDefaults(makePlan({ active: undefined })).active).toBeUndefined();
  });
});

describe("buildCreatePlanPayload", () => {
  it("incluye planType y los precios ARS", () => {
    const payload = buildCreatePlanPayload(
      makeValues({ planType: "BASIC", monthlyPriceArs: "15900", yearlyPriceArs: "" })
    );

    expect(payload.planType).toBe("BASIC");
    expect(payload.monthlyPriceArs).toBe(15900);
    expect(payload.yearlyPriceArs).toBeNull();
    expect(payload.active).toBe(true);
  });

  it("no manda los tildes de ilimitado: los traduce a -1", () => {
    const payload = buildCreatePlanPayload(
      makeValues({
        maxMenuItems: 10,
        unlimitedMenuItems: true,
        maxTables: 20,
        unlimitedTables: true,
        maxEmployees: 30,
        unlimitedEmployees: true,
        maxCategories: 40,
        unlimitedCategories: true,
        maxOptionGroups: 50,
        unlimitedOptionGroups: true,
        maxPromotions: 60,
        unlimitedPromotions: true,
      })
    );

    expect(payload).toMatchObject({
      maxMenuItems: -1,
      maxTables: -1,
      maxEmployees: -1,
      maxCategories: -1,
      maxOptionGroups: -1,
      maxPromotions: -1,
    });
    expect(Object.keys(payload).filter((key) => key.startsWith("unlimited"))).toEqual([]);
  });

  it("un límite que no es ilimitado conserva su valor, también el 0", () => {
    const payload = buildCreatePlanPayload(
      makeValues({ maxMenuItems: 0, maxTables: 12, unlimitedTables: false })
    );

    expect(payload.maxMenuItems).toBe(0);
    expect(payload.maxTables).toBe(12);
  });

  it("un precio ARS vacío (o de puros espacios) viaja como null", () => {
    const payload = buildCreatePlanPayload(makeValues({ monthlyPriceArs: "", yearlyPriceArs: "  " }));

    expect(payload.monthlyPriceArs).toBeNull();
    expect(payload.yearlyPriceArs).toBeNull();
  });

  it("un precio ARS escrito viaja como número entero", () => {
    const payload = buildCreatePlanPayload(makeValues({ monthlyPriceArs: "29900", yearlyPriceArs: "299000" }));

    expect(payload.monthlyPriceArs).toBe(29900);
    expect(payload.yearlyPriceArs).toBe(299000);
  });
});

describe("buildUpdatePlanPayload", () => {
  it("nunca incluye planType, aunque el formulario lo tenga para mostrarlo", () => {
    const payload = buildUpdatePlanPayload(makeValues({ planType: "PRO" }));

    expect(payload).not.toHaveProperty("planType");
    expect(Object.keys(payload)).not.toContain("planType");
  });

  it("incluye los campos del plan y los precios ARS", () => {
    const payload = buildUpdatePlanPayload(
      makeValues({ monthlyPriceArs: "49900", yearlyPriceArs: "499000", monthlyPriceUsd: 9.9 })
    );

    expect(payload).toMatchObject({
      displayName: "Pro",
      description: "Plan profesional",
      monthlyPriceUsd: 9.9,
      monthlyPriceArs: 49900,
      yearlyPriceArs: 499000,
      deliveryEnabled: false,
    });
  });

  it("un precio ARS vacío viaja como null para que el backend lo borre", () => {
    const payload = buildUpdatePlanPayload(makeValues({ monthlyPriceArs: "" }));

    expect(payload).toHaveProperty("monthlyPriceArs", null);
  });

  it("traduce ilimitado a -1 igual que el alta", () => {
    const payload = buildUpdatePlanPayload(
      makeValues({ maxEmployees: 7, unlimitedEmployees: true, maxCategories: 8 })
    );

    expect(payload.maxEmployees).toBe(-1);
    expect(payload.maxCategories).toBe(8);
    expect(Object.keys(payload).filter((key) => key.startsWith("unlimited"))).toEqual([]);
  });

  it("manda `active` tal como lo dejó el formulario, también false", () => {
    expect(buildUpdatePlanPayload(makeValues({ active: false }))).toHaveProperty("active", false);
    expect(buildUpdatePlanPayload(makeValues({ active: true }))).toHaveProperty("active", true);
  });

  it("no manda `active` si el plan no tenía el dato y nadie lo tocó", () => {
    const payload = buildUpdatePlanPayload(makeValues({ active: undefined }));

    expect(payload).not.toHaveProperty("active");
  });

  it("guardar un plan inactivo sin tocar el interruptor lo deja inactivo", () => {
    const values = getPlanFormDefaults(makePlan({ active: false }));

    expect(buildUpdatePlanPayload(values)).toHaveProperty("active", false);
  });
});

/** Cada límite con el tilde que lo deja sin tope. Un número distinto por límite: un cruce se nota. */
const LIMITS = [
  ["maxMenuItems", "unlimitedMenuItems"],
  ["maxTables", "unlimitedTables"],
  ["maxEmployees", "unlimitedEmployees"],
  ["maxCategories", "unlimitedCategories"],
  ["maxOptionGroups", "unlimitedOptionGroups"],
  ["maxPromotions", "unlimitedPromotions"],
] as const;

const DISTINCT_LIMITS = {
  maxMenuItems: 11,
  maxTables: 22,
  maxEmployees: 33,
  maxCategories: 44,
  maxOptionGroups: 55,
  maxPromotions: 66,
};

describe.each(LIMITS)("límite %s / %s", (max, unlimited) => {
  it("un -1 del plan abre solo su propio tilde y deja en 0 solo su propio número", () => {
    const defaults: Record<string, unknown> = getPlanFormDefaults(
      makePlan({ ...DISTINCT_LIMITS, [max]: -1 })
    );

    for (const [otherMax, otherUnlimited] of LIMITS) {
      expect(defaults[otherUnlimited], otherUnlimited).toBe(otherUnlimited === unlimited);
      expect(defaults[otherMax], otherMax).toBe(otherMax === max ? 0 : DISTINCT_LIMITS[otherMax]);
    }
  });

  it("su tilde manda -1 solo en su propio campo, en el alta y en la edición", () => {
    const values = makeValues({ ...DISTINCT_LIMITS, [unlimited]: true });

    for (const build of [buildCreatePlanPayload, buildUpdatePlanPayload]) {
      const payload = build(values) as unknown as Record<string, unknown>;
      for (const [otherMax] of LIMITS) {
        expect(payload[otherMax], otherMax).toBe(otherMax === max ? -1 : DISTINCT_LIMITS[otherMax]);
      }
    }
  });
});
