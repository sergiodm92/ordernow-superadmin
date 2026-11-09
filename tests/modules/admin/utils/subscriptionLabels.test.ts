import { describe, expect, it } from "vitest";
import {
  mayStillBeBilledByProvider,
  providerLabel,
  statusLabel,
} from "@/modules/admin/utils/subscriptionLabels";

describe("mayStillBeBilledByProvider", () => {
  it.each(["STRIPE", "MERCADO_PAGO"] as const)(
    "es true para cualquier suscripción de %s que no esté CANCELED, PAST_DUE y SUSPENDED incluidos",
    (paymentProvider) => {
      for (const status of ["ACTIVE", "PAST_DUE", "SUSPENDED", "EXPIRED"] as const) {
        expect(mayStillBeBilledByProvider({ paymentProvider, status })).toBe(true);
      }
    }
  );

  it.each(["STRIPE", "MERCADO_PAGO"] as const)("es false cuando la de %s está CANCELED", (paymentProvider) => {
    expect(mayStillBeBilledByProvider({ paymentProvider, status: "CANCELED" })).toBe(false);
  });

  it("es false si nadie la cobra (FREE o un plan asignado a mano), sea cual sea el estado, o si no hay suscripción", () => {
    expect(mayStillBeBilledByProvider({ paymentProvider: null, status: "ACTIVE" })).toBe(false);
    expect(mayStillBeBilledByProvider({ paymentProvider: undefined, status: "SUSPENDED" })).toBe(false);
    expect(mayStillBeBilledByProvider(undefined)).toBe(false);
  });
});

describe("etiquetas", () => {
  it("traduce los estados y proveedores que conoce", () => {
    expect(statusLabel("PAST_DUE")).toBe("Pago vencido");
    expect(providerLabel("MERCADO_PAGO")).toBe("Mercado Pago");
  });

  it("muestra tal cual un valor que no conoce, en vez de romper", () => {
    expect(statusLabel("PAUSED")).toBe("PAUSED");
    expect(providerLabel("PAYPAL")).toBe("PAYPAL");
  });
});
