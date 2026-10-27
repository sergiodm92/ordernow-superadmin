/** Texto que se muestra cuando un plan no tiene precio en ARS para un ciclo. */
export const NO_ARS_PRICE_LABEL = "Sin precio";

const ARS_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const isMissing = (value: number | null | undefined): value is null | undefined =>
  value === null || value === undefined || Number.isNaN(value);

/**
 * Precio en pesos argentinos, sin decimales: 49900 -> "$ 49.900".
 * null / undefined (el plan no tiene precio en ARS) -> "Sin precio".
 * El separador entre el símbolo y el número es un espacio común (Intl usa uno de no separación)
 * para que el texto sea igual en el servidor y en cualquier navegador.
 */
export function formatArsPrice(value: number | null | undefined): string {
  if (isMissing(value)) return NO_ARS_PRICE_LABEL;
  return ARS_FORMATTER.format(value).replace(/\u00A0/g, " ");
}

/** Precio de referencia en dólares: 9.9 -> "USD 9.90". Se rotula "USD" porque el ARS también usa "$". */
export function formatUsdPrice(value: number | null | undefined): string {
  if (isMissing(value)) return "—";
  return `USD ${value.toFixed(2)}`;
}
