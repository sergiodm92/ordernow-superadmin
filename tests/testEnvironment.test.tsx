import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Switch } from "@/components/ui/switch";

// Dos trampas que tenía el entorno de tests: config/api.axios.ts falla al cargarse sin
// NEXT_PUBLIC_API_URL (cualquier test que importara un hook o un servicio sin mockearlo reventaba),
// y las APIs del navegador que Radix necesita y jsdom no trae vivían en un solo archivo de tests.
describe("entorno de tests", () => {
  it("define NEXT_PUBLIC_API_URL, así que importar el cliente HTTP sin mockearlo no revienta", async () => {
    const { default: api } = await import("@/config/api.axios");

    expect(api.defaults.baseURL).toBe("http://localhost:9091/api/v1");
  });

  it("trae las APIs del navegador que usa Radix (ResizeObserver, pointer capture, scrollIntoView)", () => {
    expect(typeof ResizeObserver).toBe("function");
    expect(typeof Element.prototype.hasPointerCapture).toBe("function");
    expect(typeof Element.prototype.setPointerCapture).toBe("function");
    expect(typeof Element.prototype.releasePointerCapture).toBe("function");
    expect(typeof Element.prototype.scrollIntoView).toBe("function");
  });

  it("renderiza un interruptor de Radix en un formulario sin preparar nada en el test", () => {
    render(
      <form>
        <Switch aria-label="Activo" checked={false} onCheckedChange={() => {}} />
      </form>
    );

    expect(screen.getByRole("switch", { name: "Activo" })).toBeInTheDocument();
  });
});
