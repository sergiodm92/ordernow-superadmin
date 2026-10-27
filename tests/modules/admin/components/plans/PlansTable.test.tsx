import { describe, expect, it, vi } from "vitest";
import { configure, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Con las tablas y diálogos de Radix en jsdom, en frío o con la máquina cargada, 1 s de espera se queda corto.
vi.setConfig({ testTimeout: 30_000 });
configure({ asyncUtilTimeout: 5000 });

// toastConfirm abre un toast de sonner con "Confirmar": acá se confirma en el acto.
vi.mock("@/components/common/ToastConfirm", () => ({
  default: (callback: () => void) => callback(),
}));

import { PlansTable } from "@/modules/admin/components/plans/PlansTable";
import type { Plan } from "@/modules/admin/types/plan";
import { makePlan } from "../../../../helpers/plans";

const rowOf = (name: string): HTMLElement => {
  const row = screen.getByText(name, { selector: "td" }).closest("tr");
  if (!row) throw new Error(`No hay fila para ${name}`);
  return row;
};

describe("PlansTable: precios", () => {
  it("muestra los precios ARS en es-AR, sin decimales, con el USD de referencia al lado", () => {
    render(<PlansTable plans={[makePlan()]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const row = rowOf("Pro");
    expect(within(row).getByText("$ 29.900")).toBeInTheDocument();
    expect(within(row).getByText("$ 299.000")).toBeInTheDocument();
    expect(within(row).getByText("USD 9.99 (ref.)")).toBeInTheDocument();
    expect(within(row).getByText("USD 99.90 (ref.)")).toBeInTheDocument();
  });

  it("rotula las columnas de precio como ARS", () => {
    render(<PlansTable plans={[makePlan()]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("columnheader", { name: "Precio mensual (ARS)" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Precio anual (ARS)" })).toBeInTheDocument();
  });

  it('muestra "Sin precio" cuando el precio ARS es null, y conserva el USD de referencia', () => {
    render(
      <PlansTable
        plans={[makePlan({ monthlyPriceArs: 15900, yearlyPriceArs: null })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const row = rowOf("Pro");
    expect(within(row).getByText("$ 15.900")).toBeInTheDocument();
    expect(within(row).getAllByText("Sin precio")).toHaveLength(1);
    expect(within(row).getByText("USD 99.90 (ref.)")).toBeInTheDocument();
  });

  it('muestra "Sin precio" en los dos ciclos de un plan que todavía no tiene precios', () => {
    render(
      <PlansTable
        plans={[makePlan({ monthlyPriceArs: null, yearlyPriceArs: null })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(within(rowOf("Pro")).getAllByText("Sin precio")).toHaveLength(2);
  });

  it('un plan de una respuesta sin los campos ARS se ve "Sin precio", no "$ NaN"', () => {
    const legacy = makePlan();
    delete (legacy as Partial<Plan>).monthlyPriceArs;
    delete (legacy as Partial<Plan>).yearlyPriceArs;
    render(<PlansTable plans={[legacy]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const row = rowOf("Pro");
    expect(within(row).getAllByText("Sin precio")).toHaveLength(2);
    expect(row.textContent).not.toMatch(/NaN|undefined|null/);
  });
});

describe("PlansTable: estado", () => {
  it("muestra Activo, Inactivo y Sin dato según plan.active", () => {
    render(
      <PlansTable
        plans={[
          makePlan({ id: 1, displayName: "Activo plan", active: true }),
          makePlan({ id: 2, displayName: "Inactivo plan", active: false }),
          makePlan({ id: 3, displayName: "Sin dato plan", active: undefined }),
        ]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(within(rowOf("Activo plan")).getByText("Activo")).toBeInTheDocument();
    expect(within(rowOf("Inactivo plan")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(rowOf("Sin dato plan")).getByText("Sin dato")).toBeInTheDocument();
  });

  it('un plan con `active` indefinido no se muestra como "Inactivo"', () => {
    render(
      <PlansTable plans={[makePlan({ active: undefined })]} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    const row = rowOf("Pro");
    expect(within(row).queryByText("Inactivo")).not.toBeInTheDocument();
    expect(within(row).queryByText("Activo")).not.toBeInTheDocument();
  });

  it("un plan con active=true no se ve como inactivo (el campo ahora viene de la API)", () => {
    render(<PlansTable plans={[makePlan({ active: true })]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const row = rowOf("Pro");
    expect(within(row).getByText("Activo")).toBeInTheDocument();
    expect(within(row).queryByText("Inactivo")).not.toBeInTheDocument();
  });
});

describe("PlansTable: detalle del plan", () => {
  const openDetail = async (plan: Plan) => {
    const user = userEvent.setup();
    render(<PlansTable plans={[plan]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // Los botones de acción son solo íconos: el primero es "ver detalle".
    await user.click(within(rowOf(plan.displayName)).getAllByRole("button")[0]);
    return within(await screen.findByRole("dialog"));
  };

  it("muestra los precios ARS con su USD de referencia", async () => {
    const dialog = await openDetail(makePlan());

    expect(dialog.getByText("Detalles del Plan")).toBeInTheDocument();
    expect(dialog.getByText("Precio mensual (ARS)")).toBeInTheDocument();
    expect(dialog.getByText("$ 29.900")).toBeInTheDocument();
    expect(dialog.getByText("$ 299.000")).toBeInTheDocument();
    expect(dialog.getByText("USD 9.99 (ref.)")).toBeInTheDocument();
  });

  it('muestra "Sin precio" y el estado real del plan', async () => {
    const dialog = await openDetail(
      makePlan({ monthlyPriceArs: null, yearlyPriceArs: 299000, active: false })
    );

    expect(dialog.getByText("Sin precio")).toBeInTheDocument();
    expect(dialog.getByText("$ 299.000")).toBeInTheDocument();
    expect(dialog.getByText("Inactivo")).toBeInTheDocument();
  });

  it('muestra "Sin dato" si el plan no trae `active`', async () => {
    const dialog = await openDetail(makePlan({ active: undefined }));

    expect(dialog.getByText("Sin dato")).toBeInTheDocument();
    expect(dialog.queryByText("Inactivo")).not.toBeInTheDocument();
  });
});

describe("PlansTable: acciones que siguen funcionando", () => {
  it("editar llama a onEdit con el plan", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const plan = makePlan();
    render(<PlansTable plans={[plan]} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(within(rowOf("Pro")).getAllByRole("button")[1]);

    expect(onEdit).toHaveBeenCalledWith(plan);
  });

  it("eliminar (ya confirmado) llama a onDelete con el id", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<PlansTable plans={[makePlan({ id: 42 })]} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(within(rowOf("Pro")).getAllByRole("button")[2]);

    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it("la búsqueda filtra por nombre, descripción y tipo", async () => {
    const user = userEvent.setup();
    render(
      <PlansTable
        plans={[
          makePlan({ id: 1, displayName: "Basico", planType: "BASIC", description: "Para empezar" }),
          makePlan({ id: 2, displayName: "Profesional", planType: "PRO", description: "Para crecer" }),
        ]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText("Buscar planes..."), "crecer");

    expect(screen.getByText("Profesional", { selector: "td" })).toBeInTheDocument();
    expect(screen.queryByText("Basico", { selector: "td" })).not.toBeInTheDocument();
  });
});
