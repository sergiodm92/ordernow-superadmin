import * as z from "zod";
import type { CreatePlanDto, Plan, UpdatePlanPayload } from "../types/plan";
import { formatArsPrice, formatUsdPrice } from "../utils/formatPrice";

export const PLAN_TYPES = ["FREE", "BASIC", "PRO", "ENTERPRISE"] as const;

/** La columna `description` del backend guarda 255 caracteres: con más, el guardado falla con 409. */
export const PLAN_DESCRIPTION_MAX_LENGTH = 255;

/** El DTO del backend limita el nombre a 100 caracteres. */
export const PLAN_DISPLAY_NAME_MAX_LENGTH = 100;

/**
 * Lo más que acepta el backend como precio en pesos (pesos enteros): es lo que entra en la columna
 * que registra cada cobro. Con un precio mayor el backend responde 400.
 */
export const MAX_ARS_PRICE = 99_999_999;

/** Lo más que entra en la columna del precio en USD (numeric(10,2)): con más, el backend responde 409. */
export const MAX_USD_PRICE = 99_999_999.99;

/** Lo más que entra en las columnas de los límites (int de 32 bits): con más, el backend responde 409. */
export const MAX_PLAN_LIMIT = 2_147_483_647;

export const ARS_PRICE_MESSAGES = {
  format:
    "El precio en ARS debe ser un número entero de pesos, sin puntos, comas ni símbolos (ej. 49900).",
  min: "El precio en ARS debe ser de $ 1 o más. Si el plan no tiene precio, dejar el campo vacío.",
  max: `El precio en ARS no puede superar ${formatArsPrice(MAX_ARS_PRICE)}.`,
} as const;

export const USD_PRICE_MESSAGES = {
  required: "Ingresar un precio en USD (0 o más).",
  min: "El precio debe ser mayor o igual a 0",
  max: `El precio en USD no puede superar ${formatUsdPrice(MAX_USD_PRICE)}.`,
} as const;

export const LIMIT_MESSAGES = {
  required: "Ingresar un número, o tildar Ilimitado.",
  integer: "El límite debe ser un número entero.",
  min: "El límite no puede ser negativo. Para no poner tope, tildar Ilimitado.",
  max: `El límite no puede superar ${MAX_PLAN_LIMIT.toLocaleString("es-AR")}.`,
} as const;

const ARS_DIGITS_ONLY = /^\d+$/;

/**
 * Lo que se escribió en un campo de precio ARS, como número. Vacío = sin precio = null.
 * Solo se aceptan dígitos: con "50.000" o "1,5" no hay forma segura de saber si el punto o la coma
 * separan miles o decimales, y leerlos mal guardaría un precio mil veces menor sin avisar.
 * Lo que no son dígitos devuelve NaN.
 */
export function parseArsPriceInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  return ARS_DIGITS_ONLY.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** Mensaje de error de un precio ARS escrito, o undefined si es válido (o está vacío). */
export function getArsPriceError(text: string): string | undefined {
  const price = parseArsPriceInput(text);
  if (price === null) return undefined;
  if (Number.isNaN(price)) return ARS_PRICE_MESSAGES.format;
  if (price < 1) return ARS_PRICE_MESSAGES.min;
  if (price > MAX_ARS_PRICE) return ARS_PRICE_MESSAGES.max;
  return undefined;
}

/** Vacío = sin precio. Con valor: pesos enteros escritos solo con dígitos, de 1 en adelante. */
const arsPriceSchema = z
  .string({
    required_error: ARS_PRICE_MESSAGES.format,
    invalid_type_error: ARS_PRICE_MESSAGES.format,
  })
  .superRefine((text, ctx) => {
    const message = getArsPriceError(text);
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  });

const usdPriceSchema = z
  .number({
    required_error: USD_PRICE_MESSAGES.required,
    invalid_type_error: USD_PRICE_MESSAGES.required,
  })
  .min(0, USD_PRICE_MESSAGES.min)
  .max(MAX_USD_PRICE, USD_PRICE_MESSAGES.max);

/**
 * Un límite vacío es `null` en el formulario (nunca 0: el campo reescribiría lo que se escribe).
 * Si es válido o no depende del tilde "Ilimitado", así que lo decide `refineLimits`.
 */
const limitSchema = z
  .number({ required_error: LIMIT_MESSAGES.required, invalid_type_error: LIMIT_MESSAGES.required })
  .nullable();

const planFieldsShape = {
  displayName: z
    .string()
    .min(1, "El nombre es requerido")
    .max(
      PLAN_DISPLAY_NAME_MAX_LENGTH,
      `El nombre no puede superar los ${PLAN_DISPLAY_NAME_MAX_LENGTH} caracteres`
    ),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .max(
      PLAN_DESCRIPTION_MAX_LENGTH,
      `La descripción no puede superar los ${PLAN_DESCRIPTION_MAX_LENGTH} caracteres`
    ),
  maxMenuItems: limitSchema,
  maxTables: limitSchema,
  maxEmployees: limitSchema,
  maxCategories: limitSchema,
  maxOptionGroups: limitSchema,
  maxPromotions: limitSchema,
  unlimitedMenuItems: z.boolean(),
  unlimitedTables: z.boolean(),
  unlimitedEmployees: z.boolean(),
  unlimitedCategories: z.boolean(),
  unlimitedOptionGroups: z.boolean(),
  unlimitedPromotions: z.boolean(),
  deliveryEnabled: z.boolean(),
  monthlyPriceUsd: usdPriceSchema,
  yearlyPriceUsd: usdPriceSchema,
  monthlyPriceArs: arsPriceSchema,
  yearlyPriceArs: arsPriceSchema,
  /**
   * Indefinido solo en edición, cuando el plan no trae el dato. Ahí el formulario no lo toca y
   * el guardado no lo manda, así que no cambia el estado del plan.
   */
  active: z.boolean().optional(),
};

/** Cada límite y el tilde que lo deja sin tope. */
const LIMIT_FIELDS = [
  ["maxMenuItems", "unlimitedMenuItems"],
  ["maxTables", "unlimitedTables"],
  ["maxEmployees", "unlimitedEmployees"],
  ["maxCategories", "unlimitedCategories"],
  ["maxOptionGroups", "unlimitedOptionGroups"],
  ["maxPromotions", "unlimitedPromotions"],
] as const;

function getLimitError(value: number | null): string | undefined {
  if (value === null) return LIMIT_MESSAGES.required;
  if (!Number.isInteger(value)) return LIMIT_MESSAGES.integer;
  if (value < 0) return LIMIT_MESSAGES.min;
  if (value > MAX_PLAN_LIMIT) return LIMIT_MESSAGES.max;
  return undefined;
}

/** Con "Ilimitado" tildado el número no se ve ni se manda (se manda -1): ahí no se valida. */
function refineLimits(
  values: Record<(typeof LIMIT_FIELDS)[number][number], number | boolean | null>,
  ctx: z.RefinementCtx
) {
  for (const [field, unlimitedField] of LIMIT_FIELDS) {
    if (values[unlimitedField]) continue;
    const message = getLimitError(values[field] as number | null);
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
  }
}

/** Alta: el tipo de plan es obligatorio. */
export const createPlanSchema = z
  .object({
    planType: z.string().min(1, "El tipo de plan es requerido"),
    ...planFieldsShape,
  })
  .superRefine(refineLimits);

/**
 * Edición: el tipo de plan solo se muestra (no se puede cambiar), así que no se exige ni se manda.
 * El tipo sigue en los valores del formulario para mostrarlo, pero `buildUpdatePlanPayload` no lo copia.
 */
export const editPlanSchema = z
  .object({
    planType: z.string(),
    ...planFieldsShape,
  })
  .superRefine(refineLimits);

export type PlanFormValues = z.infer<typeof createPlanSchema>;
export type PlanFormMode = "create" | "edit";

export const getPlanFormSchema = (mode: PlanFormMode) =>
  mode === "edit" ? editPlanSchema : createPlanSchema;

/** En el formulario, "ilimitado" es un tilde aparte y el número queda en 0; en el backend es -1. */
const toFormLimit = (value: number | undefined): number =>
  value === undefined || value === -1 ? 0 : value;

/** Un precio ARS del plan, como texto del campo. Sin precio = vacío. */
const toArsPriceInput = (price: number | null | undefined): string =>
  price === null || price === undefined ? "" : String(price);

/**
 * Valores iniciales del formulario. Sin plan (alta): vacío y activo, como crea el backend.
 * Con plan (edición): lo que trae el plan, incluido `active`, que solo cambia con el interruptor.
 */
export function getPlanFormDefaults(plan?: Plan): PlanFormValues {
  return {
    planType: plan?.planType ?? "",
    displayName: plan?.displayName ?? "",
    description: plan?.description ?? "",
    maxMenuItems: toFormLimit(plan?.maxMenuItems),
    maxTables: toFormLimit(plan?.maxTables),
    maxEmployees: toFormLimit(plan?.maxEmployees),
    maxCategories: toFormLimit(plan?.maxCategories),
    maxOptionGroups: toFormLimit(plan?.maxOptionGroups),
    maxPromotions: toFormLimit(plan?.maxPromotions),
    unlimitedMenuItems: plan?.maxMenuItems === -1,
    unlimitedTables: plan?.maxTables === -1,
    unlimitedEmployees: plan?.maxEmployees === -1,
    unlimitedCategories: plan?.maxCategories === -1,
    unlimitedOptionGroups: plan?.maxOptionGroups === -1,
    unlimitedPromotions: plan?.maxPromotions === -1,
    deliveryEnabled: plan?.deliveryEnabled ?? false,
    monthlyPriceUsd: plan?.monthlyPriceUsd ?? 0,
    yearlyPriceUsd: plan?.yearlyPriceUsd ?? 0,
    monthlyPriceArs: toArsPriceInput(plan?.monthlyPriceArs),
    yearlyPriceArs: toArsPriceInput(plan?.yearlyPriceArs),
    active: plan ? plan.active : true,
  };
}

/**
 * Con "Ilimitado" tildado, -1. Si no, el número, que el esquema ya validó (entero, de 0 en adelante):
 * un límite vacío no pasa la validación, así que acá nunca llega `null`.
 */
const toLimit = (value: number | null, unlimited: boolean): number =>
  unlimited ? -1 : (value as number);

/** Campos que comparten el alta y la edición. */
function buildPlanFields(values: PlanFormValues) {
  return {
    displayName: values.displayName,
    description: values.description,
    maxMenuItems: toLimit(values.maxMenuItems, values.unlimitedMenuItems),
    maxTables: toLimit(values.maxTables, values.unlimitedTables),
    maxEmployees: toLimit(values.maxEmployees, values.unlimitedEmployees),
    maxCategories: toLimit(values.maxCategories, values.unlimitedCategories),
    maxOptionGroups: toLimit(values.maxOptionGroups, values.unlimitedOptionGroups),
    maxPromotions: toLimit(values.maxPromotions, values.unlimitedPromotions),
    deliveryEnabled: values.deliveryEnabled,
    monthlyPriceUsd: values.monthlyPriceUsd,
    yearlyPriceUsd: values.yearlyPriceUsd,
    monthlyPriceArs: parseArsPriceInput(values.monthlyPriceArs),
    yearlyPriceArs: parseArsPriceInput(values.yearlyPriceArs),
  };
}

/** Cuerpo de POST /plans: incluye el tipo de plan. */
export function buildCreatePlanPayload(values: PlanFormValues): CreatePlanDto {
  return {
    planType: values.planType,
    ...buildPlanFields(values),
    active: values.active ?? true,
  };
}

/**
 * Cuerpo de PUT /plans/:id. Nunca lleva `planType` (el backend responde 400 si llega) y solo lleva
 * `active` si el formulario lo tiene, para que guardar no cambie el estado de un plan sin dato.
 * Un precio ARS vacío viaja como null: el backend lo interpreta como "borrar el precio".
 */
export function buildUpdatePlanPayload(values: PlanFormValues): UpdatePlanPayload {
  return {
    ...buildPlanFields(values),
    ...(values.active === undefined ? {} : { active: values.active }),
  };
}
