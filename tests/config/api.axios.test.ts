import { afterEach, describe, expect, it, vi } from "vitest";

// La primera carga del módulo (axios, sonner, js-cookie) puede tardar varios segundos en frío.
vi.setConfig({ testTimeout: 30_000 });

const ENV_KEY = "NEXT_PUBLIC_API_URL";
const originalValue = process.env[ENV_KEY];

/** El módulo lee la variable al evaluarse: cada caso lo carga de cero. */
const loadApiModule = async () => {
  vi.resetModules();
  return import("@/config/api.axios");
};

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }
});

describe("config/api.axios: URL de la API", () => {
  it("falla al cargarse, con un mensaje explícito, si falta NEXT_PUBLIC_API_URL", async () => {
    delete process.env[ENV_KEY];

    await expect(loadApiModule()).rejects.toThrow(/Falta la variable de entorno NEXT_PUBLIC_API_URL/);
  });

  it("el mensaje explica dónde definirla y cómo se ve", async () => {
    delete process.env[ENV_KEY];

    const error = await loadApiModule().catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(".env.local");
    expect((error as Error).message).toContain(".env.example");
    expect((error as Error).message).toContain("/api/v1");
  });

  it("trata una variable vacía o de puros espacios como faltante", async () => {
    process.env[ENV_KEY] = "";
    await expect(loadApiModule()).rejects.toThrow(/NEXT_PUBLIC_API_URL/);

    process.env[ENV_KEY] = "   ";
    await expect(loadApiModule()).rejects.toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("no cae a ninguna IP de la LAN cuando falta la variable", async () => {
    delete process.env[ENV_KEY];

    const error = await loadApiModule().catch((e: Error) => e);

    expect((error as Error).message).not.toMatch(/192\.168|:9090/);
  });

  it("usa NEXT_PUBLIC_API_URL como baseURL del cliente", async () => {
    process.env[ENV_KEY] = "http://localhost:9091/api/v1";

    const { default: api } = await loadApiModule();

    expect(api.defaults.baseURL).toBe("http://localhost:9091/api/v1");
  });

  it("ignora los espacios que sobran alrededor de la URL", async () => {
    process.env[ENV_KEY] = "  https://api.example.com/api/v1 ";

    const { default: api } = await loadApiModule();

    expect(api.defaults.baseURL).toBe("https://api.example.com/api/v1");
  });
});
