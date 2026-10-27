import { describe, expect, it } from "vitest";
import {
  NO_ARS_PRICE_LABEL,
  formatArsPrice,
  formatUsdPrice,
} from "@/modules/admin/utils/formatPrice";

describe("formatArsPrice", () => {
  it("formatea en es-AR, sin decimales y con punto de miles", () => {
    expect(formatArsPrice(49900)).toBe("$ 49.900");
    expect(formatArsPrice(299000)).toBe("$ 299.000");
    expect(formatArsPrice(1234567)).toBe("$ 1.234.567");
  });

  it("agrupa también los miles de cuatro cifras (es-AR, no es-ES)", () => {
    expect(formatArsPrice(1000)).toBe("$ 1.000");
    expect(formatArsPrice(9999)).toBe("$ 9.999");
  });

  it("no agrega punto a los montos chicos", () => {
    expect(formatArsPrice(1)).toBe("$ 1");
    expect(formatArsPrice(999)).toBe("$ 999");
  });

  it("no muestra decimales aunque el número los tenga", () => {
    expect(formatArsPrice(49900.4)).toBe("$ 49.900");
    expect(formatArsPrice(29900.0)).toBe("$ 29.900");
  });

  it("formatea el tope que acepta el backend", () => {
    expect(formatArsPrice(99_999_999)).toBe("$ 99.999.999");
  });

  it("usa un espacio común entre el símbolo y el número (no uno de no separación)", () => {
    expect(formatArsPrice(49900)).not.toContain("\u00A0");
  });

  it('devuelve "Sin precio" para null y para undefined', () => {
    expect(formatArsPrice(null)).toBe("Sin precio");
    expect(formatArsPrice(undefined)).toBe("Sin precio");
    expect(NO_ARS_PRICE_LABEL).toBe("Sin precio");
  });

  it('devuelve "Sin precio" para NaN en lugar de "$ NaN"', () => {
    expect(formatArsPrice(Number.NaN)).toBe("Sin precio");
  });
});

describe("formatUsdPrice", () => {
  it("rotula USD y muestra dos decimales", () => {
    expect(formatUsdPrice(9.9)).toBe("USD 9.90");
    expect(formatUsdPrice(49.99)).toBe("USD 49.99");
    expect(formatUsdPrice(0)).toBe("USD 0.00");
  });

  it("no inventa un monto cuando falta el dato", () => {
    expect(formatUsdPrice(null)).toBe("—");
    expect(formatUsdPrice(undefined)).toBe("—");
  });
});
