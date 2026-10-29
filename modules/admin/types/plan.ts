// A mano y no derivados de `Schemas["PlanDto"]` como el resto de los tipos de admin: `types/api.generated.ts`
// sale de un contrato donde el plan no trae los precios en ARS, `active`, `createdAt` ni `updatedAt`, y
// regenerarlo contra el contrato actual del backend renombra schemas que usan otros modulos (User, Role,
// Permission). Cuando se refresque ese archivo (`npm run gen:api`), estos tipos se pueden volver a derivar.
export interface Plan {
  id: number;
  planType: string;
  displayName: string;
  description: string;
  maxMenuItems: number;
  maxTables: number;
  maxEmployees: number;
  maxCategories: number;
  maxOptionGroups: number;
  maxPromotions: number;
  deliveryEnabled: boolean;
  /** Precio de referencia en USD (lo que cobra Mercado Pago es el precio en ARS). */
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  /** Pesos enteros que cobra Mercado Pago cada mes. null = sin precio: el plan no se puede comprar con Mercado Pago. */
  monthlyPriceArs: number | null;
  /** Pesos enteros que cobra Mercado Pago cada año. null = sin precio para el ciclo anual. */
  yearlyPriceArs: number | null;
  /**
   * El backend actual siempre lo manda. Es opcional por tolerancia con respuestas sin el campo:
   * un plan con `active` indefinido no se muestra como inactivo ni cambia de estado al guardarlo.
   */
  active?: boolean;
  /** Fechas ISO; null si el backend no las tiene. */
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreatePlanDto {
  planType: string;
  displayName: string;
  description: string;
  maxMenuItems: number;
  maxTables: number;
  maxEmployees: number;
  maxCategories: number;
  maxOptionGroups: number;
  maxPromotions: number;
  deliveryEnabled: boolean;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  /** Pesos enteros (1 o más), o null para dejarlo sin precio. */
  monthlyPriceArs?: number | null;
  yearlyPriceArs?: number | null;
  /** El backend lo crea activo si no se manda. */
  active?: boolean;
}

/**
 * PUT /plans/:id es una actualización parcial y NO acepta `planType`: el tipo de un plan no se
 * cambia, y el backend responde 400 ante cualquier propiedad que no conoce.
 * En los precios ARS, `null` borra el precio y omitirlos los deja como están.
 */
export interface UpdatePlanDto extends Partial<Omit<CreatePlanDto, "planType">> {
  id: number;
}

/** Cuerpo de PUT /plans/:id: lo que arma el formulario en modo edición (el id va en la URL). */
export type UpdatePlanPayload = Omit<UpdatePlanDto, "id">;
