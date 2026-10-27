import { afterEach, describe, expect, it, vi } from "vitest";
import { configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanDialog } from "@/modules/admin/components/plans/PlanDialog";
import type { Plan } from "@/modules/admin/types/plan";
import { ARS_PRICE_MESSAGES, LIMIT_MESSAGES, USD_PRICE_MESSAGES } from "@/modules/admin/validations/planValidation";
import { makePlan } from "../../../../helpers/plans";

// El formulario es grande (jsdom + Radix + escritura tecla a tecla): el primer caso puede tardar
// varios segundos en frío, y el límite por defecto (5 s) lo dejaría al borde de fallar.
vi.setConfig({ testTimeout: 30_000 });
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  vi.clearAllMocks();
});

/** Se abre como lo hace la página de planes: con el plan a editar y sin disparador. */
const renderEdit = (plan: Plan = makePlan()) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <PlanDialog plan={plan} title="Editar Plan" onSubmit={onSubmit} onClose={onClose} trigger={null} />
  );
  return { onSubmit, onClose, user: userEvent.setup() };
};

const renderCreate = () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<PlanDialog title="Crear Plan" onSubmit={onSubmit} trigger={<button>Abrir</button>} />);
  return { onSubmit, user: userEvent.setup() };
};

const submitEdit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Actualizar Plan" }));

const lastPayload = (onSubmit: ReturnType<typeof vi.fn>) => {
  expect(onSubmit).toHaveBeenCalledTimes(1);
  return onSubmit.mock.calls[0][0] as Record<string, unknown>;
};

describe("PlanDialog en modo edición", () => {
  it("muestra el tipo de plan de solo lectura", async () => {
    renderEdit(makePlan({ planType: "PRO" }));

    const type = await screen.findByLabelText("Tipo de Plan");
    expect(type).toBeDisabled();
    expect(type).toHaveValue("PRO");
    expect(screen.getByText("El tipo de un plan no se puede cambiar.")).toBeInTheDocument();
  });

  it("no ofrece el selector de tipo", async () => {
    renderEdit();

    await screen.findByLabelText("Tipo de Plan");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("al guardar llama a onSubmit sin planType", async () => {
    const { onSubmit, user } = renderEdit();

    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = lastPayload(onSubmit);
    expect(payload).not.toHaveProperty("planType");
    expect(Object.keys(payload)).not.toContain("planType");
  });

  it("guardar sin tocar nada conserva todos los campos del plan", async () => {
    const { onSubmit, user } = renderEdit(
      makePlan({ maxTables: -1, monthlyPriceArs: 29900, yearlyPriceArs: null })
    );

    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toEqual({
      displayName: "Pro",
      description: "Plan profesional",
      maxMenuItems: 500,
      maxTables: -1,
      maxEmployees: 50,
      maxCategories: 100,
      maxOptionGroups: 30,
      maxPromotions: 30,
      deliveryEnabled: true,
      monthlyPriceUsd: 9.99,
      yearlyPriceUsd: 99.9,
      monthlyPriceArs: 29900,
      yearlyPriceArs: null,
      active: true,
    });
  });

  it("cierra el diálogo y avisa con onClose cuando el guardado sale bien", async () => {
    const { onSubmit, onClose, user } = renderEdit();

    await submitEdit(user);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("si el guardado falla, el diálogo sigue abierto", async () => {
    const { onSubmit, onClose, user } = renderEdit();
    onSubmit.mockRejectedValueOnce(new Error("boom"));

    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("PlanDialog: precios en ARS", () => {
  it("muestra los campos en ARS y rotula el USD como referencia", async () => {
    renderEdit();

    expect(await screen.findByLabelText("Precio mensual (ARS)")).toHaveValue("29900");
    expect(screen.getByLabelText("Precio anual (ARS)")).toHaveValue("299000");
    expect(screen.getByLabelText("Precio mensual (USD, referencia)")).toHaveValue(9.99);
    expect(screen.getByLabelText("Precio anual (USD, referencia)")).toHaveValue(99.9);
  });

  it("avisa que los precios nuevos rigen para suscripciones nuevas y que sin precio no se compra", async () => {
    renderEdit();

    const notice = await screen.findByRole("note");
    expect(notice).toHaveTextContent(/precios nuevos rigen para las suscripciones nuevas/i);
    expect(notice).toHaveTextContent(/suscripciones activas conservan el monto/i);
    expect(notice).toHaveTextContent(/sin precio en ARS.*no se puede comprar con Mercado Pago/i);
  });

  it("un plan sin precios muestra los campos vacíos", async () => {
    renderEdit(makePlan({ monthlyPriceArs: null, yearlyPriceArs: null }));

    expect(await screen.findByLabelText("Precio mensual (ARS)")).toHaveValue("");
    expect(screen.getByLabelText("Precio anual (ARS)")).toHaveValue("");
  });

  it("guarda el precio nuevo como entero", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.clear(monthly);
    await user.type(monthly, "49900");
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = lastPayload(onSubmit);
    expect(payload).toMatchObject({ monthlyPriceArs: 49900, yearlyPriceArs: 299000 });
    expect(typeof payload.monthlyPriceArs).toBe("number");
  });

  it("ignora los espacios que sobran alrededor del precio", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.clear(monthly);
    await user.type(monthly, "  49900 ");
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("monthlyPriceArs", 49900);
  });

  it("vaciar un precio lo manda como null (el backend lo borra)", async () => {
    const { onSubmit, user } = renderEdit();

    await user.clear(await screen.findByLabelText("Precio anual (ARS)"));
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = lastPayload(onSubmit);
    expect(payload).toHaveProperty("yearlyPriceArs", null);
    expect(payload).toHaveProperty("monthlyPriceArs", 29900);
  });

  it("es un campo de texto numérico, no un type=number que lea mal los puntos", async () => {
    renderEdit();

    const monthly = await screen.findByLabelText("Precio mensual (ARS)");
    expect(monthly).toHaveAttribute("type", "text");
    expect(monthly).toHaveAttribute("inputmode", "numeric");
  });

  it("rechaza un precio con decimales y no llama a onSubmit", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.clear(monthly);
    await user.type(monthly, "49.5");
    await submitEdit(user);

    expect(await screen.findByText(ARS_PRICE_MESSAGES.format)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Antes: type=number leía "50.000" como 50 y se guardaba $ 50 (mil veces menos) sin ningún aviso.
  it.each([
    ["50.000", "con punto de miles"],
    ["1.000.000", "con dos puntos de miles"],
    ["10,000", "con coma de miles"],
    ["50.000,00", "con miles y decimales al estilo es-AR"],
    ["$ 50.000", "con el símbolo $ (así se ve en la tabla)"],
    ["1e3", "en notación científica"],
  ])("rechaza %s (%s) en vez de guardarlo mal leído", async (typed) => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.clear(monthly);
    await user.type(monthly, typed);
    await submitEdit(user);

    expect(await screen.findByText(ARS_PRICE_MESSAGES.format)).toBeInTheDocument();
    expect(monthly).toHaveValue(typed);
    expect(monthly).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza un precio pegado con el formato de la tabla", async () => {
    const { onSubmit, user } = renderEdit();
    const yearly = await screen.findByLabelText("Precio anual (ARS)");

    await user.clear(yearly);
    await user.click(yearly);
    await user.paste("$ 299.000");
    await submitEdit(user);

    expect(await screen.findByText(ARS_PRICE_MESSAGES.format)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("debajo del campo dice cómo se va a guardar el precio", async () => {
    const { user } = renderEdit(makePlan({ monthlyPriceArs: null, yearlyPriceArs: null }));
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    expect(screen.queryByText(/Se guardará como/)).not.toBeInTheDocument();
    await user.type(monthly, "50000");

    expect(await screen.findByText("Se guardará como $ 50.000")).toBeInTheDocument();
  });

  it("no dice cómo se guarda un precio que no es válido", async () => {
    const { user } = renderEdit(makePlan({ monthlyPriceArs: null, yearlyPriceArs: null }));
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.type(monthly, "50.000");

    expect(screen.queryByText(/Se guardará como/)).not.toBeInTheDocument();
  });

  it("la ayuda del campo pide solo números, sin puntos ni comas", async () => {
    renderEdit();

    await screen.findByLabelText("Precio mensual (ARS)");
    expect(screen.getAllByText(/Solo números, sin puntos ni comas/).length).toBeGreaterThan(0);
  });

  it("rechaza 0: el mínimo es $ 1", async () => {
    const { onSubmit, user } = renderEdit();
    const yearly = await screen.findByLabelText("Precio anual (ARS)");

    await user.clear(yearly);
    await user.type(yearly, "0");
    await submitEdit(user);

    expect(await screen.findByText(ARS_PRICE_MESSAGES.min)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza un negativo", async () => {
    const { onSubmit, user } = renderEdit();
    const yearly = await screen.findByLabelText("Precio anual (ARS)");

    await user.clear(yearly);
    await user.type(yearly, "-500");
    await submitEdit(user);

    expect(await screen.findByText(ARS_PRICE_MESSAGES.format)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("acepta el tope del backend ($ 99.999.999) y rechaza un peso más", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (ARS)");

    await user.clear(monthly);
    await user.type(monthly, "100000000");
    await submitEdit(user);
    expect(await screen.findByText(/no puede superar \$ 99\.999\.999/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(monthly);
    await user.type(monthly, "99999999");
    await submitEdit(user);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("monthlyPriceArs", 99_999_999);
  });
});

describe("PlanDialog: descripción", () => {
  it("muestra un contador de caracteres sobre 255", async () => {
    renderEdit(makePlan({ description: "Plan profesional" }));

    expect(await screen.findByText("16/255")).toBeInTheDocument();
  });

  it("rechaza más de 255 caracteres con un mensaje y no llama a onSubmit", async () => {
    const { onSubmit, user } = renderEdit();
    const description = await screen.findByLabelText("Descripción");

    fireEvent.change(description, { target: { value: "a".repeat(256) } });
    expect(screen.getByText("256/255")).toBeInTheDocument();
    await submitEdit(user);

    expect(
      await screen.findByText("La descripción no puede superar los 255 caracteres")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("acepta exactamente 255 caracteres", async () => {
    const { onSubmit, user } = renderEdit();
    const description = await screen.findByLabelText("Descripción");

    fireEvent.change(description, { target: { value: "a".repeat(255) } });
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit).description).toBe("a".repeat(255));
  });

  it("el contador está asociado al campo: un lector de pantalla lo anuncia como su descripción", async () => {
    renderEdit(makePlan({ description: "Plan profesional" }));

    const description = await screen.findByLabelText("Descripción");
    expect(description).toHaveAccessibleDescription("16/255");
  });
});

describe("PlanDialog: estado activo", () => {
  const activeSwitch = () => screen.findByRole("switch", { name: "Activo" });

  it("un plan inactivo se abre con el interruptor apagado y guardar no lo reactiva", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: false }));

    expect(await activeSwitch()).toHaveAttribute("aria-checked", "false");
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", false);
  });

  it("un plan activo se abre con el interruptor encendido y guardar no lo desactiva", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: true }));

    expect(await activeSwitch()).toHaveAttribute("aria-checked", "true");
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", true);
  });

  it("el interruptor reactiva un plan inactivo", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: false }));

    await user.click(await activeSwitch());
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", true);
  });

  it("el interruptor desactiva un plan activo", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: true }));

    await user.click(await activeSwitch());
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", false);
  });

  it("un plan sin dato de `active` no cambia de estado si nadie toca el interruptor", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: undefined }));

    expect(await activeSwitch()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/No se pudo leer el estado actual del plan/)).toBeInTheDocument();
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).not.toHaveProperty("active");
  });

  it("en un plan sin dato, el interruptor sí fija el estado elegido", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ active: undefined }));

    await user.click(await activeSwitch());
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", true);
  });
});

/** El bloque de un límite ("Mesas", "Empleados"...): su tilde "Ilimitado" y su número. */
const limitBlock = async (label: string): Promise<HTMLElement> =>
  (await screen.findByText(label)).closest("div")!.parentElement!;

describe("PlanDialog: límites ilimitados", () => {
  it("un límite en -1 se abre como ilimitado y se guarda como -1", async () => {
    const { onSubmit, user } = renderEdit(makePlan({ maxTables: -1 }));

    const tables = await limitBlock("Mesas");
    expect(within(tables).getByRole("checkbox")).toBeChecked();
    expect(within(tables).queryByRole("spinbutton")).not.toBeInTheDocument();
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("maxTables", -1);
  });

  it("un límite vacío no frena el guardado si el tilde Ilimitado está puesto", async () => {
    const { onSubmit, user } = renderEdit();

    const tables = await limitBlock("Mesas");
    await user.clear(within(tables).getByRole("spinbutton"));
    await user.click(within(tables).getByRole("checkbox"));
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("maxTables", -1);
  });
});

describe("PlanDialog: límites numéricos", () => {
  const spinbutton = async (label: string) => within(await limitBlock(label)).getByRole("spinbutton");

  it("vaciar un límite no lo convierte en 0: queda vacío, con un mensaje, y no se guarda", async () => {
    const { onSubmit, user } = renderEdit();
    const input = await spinbutton("Menu Items");

    await user.clear(input);
    expect(input).toHaveValue(null);
    await submitEdit(user);

    expect(await screen.findByText(LIMIT_MESSAGES.required)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Antes: vaciar el campo lo ponía en 0 y React reescribía el texto, así que al escribir 100
  // quedaba "0100" (en el navegador, un "9." intermedio se leía vacío y perdía los dígitos).
  it("al borrar y escribir un número, el texto del campo es justo lo que se escribió", async () => {
    const { onSubmit, user } = renderEdit();
    const input = (await spinbutton("Menu Items")) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "100");

    expect(input.value).toBe("100");
    await submitEdit(user);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("maxMenuItems", 100);
  });

  it("rechaza un límite negativo (no es lo mismo que ilimitado)", async () => {
    const { onSubmit, user } = renderEdit();
    const input = await spinbutton("Empleados");

    await user.clear(input);
    await user.type(input, "-1");
    await submitEdit(user);

    expect(await screen.findByText(LIMIT_MESSAGES.min)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza un límite con decimales", async () => {
    const { onSubmit, user } = renderEdit();
    const input = await spinbutton("Categorías");

    await user.clear(input);
    await user.type(input, "2.5");
    await submitEdit(user);

    expect(await screen.findByText(LIMIT_MESSAGES.integer)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza un límite que no entra en la base de datos (más de 2.147.483.647)", async () => {
    const { onSubmit, user } = renderEdit();
    const input = await spinbutton("Promociones");

    await user.clear(input);
    await user.type(input, "2147483648");
    await submitEdit(user);

    expect(await screen.findByText(/no puede superar 2\.147\.483\.647/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("acepta el 0 y el máximo que entra en la base de datos", async () => {
    const { onSubmit, user } = renderEdit();
    const items = await spinbutton("Menu Items");
    const groups = await spinbutton("Grupos de opciones");

    await user.clear(items);
    await user.type(items, "0");
    await user.clear(groups);
    await user.type(groups, "2147483647");
    await submitEdit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toMatchObject({ maxMenuItems: 0, maxOptionGroups: 2_147_483_647 });
  });
});

describe("PlanDialog: precios en USD (referencia)", () => {
  it("vaciar el precio no lo convierte en 0: queda vacío, con un mensaje, y no se guarda", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (USD, referencia)");

    await user.clear(monthly);
    expect(monthly).toHaveValue(null);
    await submitEdit(user);

    expect(await screen.findByText(USD_PRICE_MESSAGES.required)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("guarda exactamente el precio escrito, con decimales", async () => {
    const { onSubmit, user } = renderEdit();
    const yearly = (await screen.findByLabelText("Precio anual (USD, referencia)")) as HTMLInputElement;

    await user.clear(yearly);
    await user.type(yearly, "12.5");

    expect(yearly.value).toBe("12.5");
    await submitEdit(user);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("yearlyPriceUsd", 12.5);
  });

  it("rechaza un precio negativo", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (USD, referencia)");

    await user.clear(monthly);
    await user.type(monthly, "-5");
    await submitEdit(user);

    expect(await screen.findByText(USD_PRICE_MESSAGES.min)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza un precio que no entra en la base de datos (USD 100.000.000 o más)", async () => {
    const { onSubmit, user } = renderEdit();
    const monthly = await screen.findByLabelText("Precio mensual (USD, referencia)");

    await user.clear(monthly);
    await user.type(monthly, "100000000");
    await submitEdit(user);

    expect(await screen.findByText(USD_PRICE_MESSAGES.max)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("PlanDialog: guardando", () => {
  /** Un onSubmit que no termina hasta que el test lo decide. */
  const renderSlowEdit = () => {
    const rendered = renderEdit();
    let finish!: () => void;
    rendered.onSubmit.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    return { ...rendered, finish: () => finish() };
  };

  it("mientras guarda, el botón queda deshabilitado y dice que está guardando", async () => {
    const { user, finish } = renderSlowEdit();

    await submitEdit(user);

    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("un doble clic manda un solo guardado", async () => {
    const { onSubmit, user, finish } = renderSlowEdit();

    await user.dblClick(screen.getByRole("button", { name: "Actualizar Plan" }));
    await screen.findByRole("button", { name: "Guardando..." });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("si el guardado falla, el botón vuelve a estar disponible para reintentar", async () => {
    const { onSubmit, user } = renderEdit();
    onSubmit.mockRejectedValueOnce(new Error("boom"));

    await submitEdit(user);

    const retry = await screen.findByRole("button", { name: "Actualizar Plan" });
    expect(retry).toBeEnabled();
  });
});

describe("PlanDialog en modo alta", () => {
  it("ofrece el selector de tipo y exige elegir uno", async () => {
    const { onSubmit, user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    expect(await screen.findByLabelText("Tipo de Plan")).toBeEnabled();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre"), "Basic");
    await user.type(screen.getByLabelText("Descripción"), "Plan basico");
    await user.click(screen.getByRole("button", { name: "Crear Plan" }));

    expect(await screen.findByText("El tipo de plan es requerido")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("crea un plan con planType, sin precios ARS (null) y activo", async () => {
    const { onSubmit, user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "BASIC" }));
    await user.type(screen.getByLabelText("Nombre"), "Basic");
    await user.type(screen.getByLabelText("Descripción"), "Plan basico");
    await user.click(screen.getByRole("button", { name: "Crear Plan" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = lastPayload(onSubmit);
    expect(payload).toMatchObject({
      planType: "BASIC",
      displayName: "Basic",
      description: "Plan basico",
      monthlyPriceArs: null,
      yearlyPriceArs: null,
      active: true,
    });
  });

  it("crea un plan con precios en ARS", async () => {
    const { onSubmit, user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "PRO" }));
    await user.type(screen.getByLabelText("Nombre"), "Pro");
    await user.type(screen.getByLabelText("Descripción"), "Plan pro");
    await user.type(screen.getByLabelText("Precio mensual (ARS)"), "29900");
    await user.type(screen.getByLabelText("Precio anual (ARS)"), "299000");
    await user.click(screen.getByRole("button", { name: "Crear Plan" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toMatchObject({
      planType: "PRO",
      monthlyPriceArs: 29900,
      yearlyPriceArs: 299000,
    });
  });

  it("crea un plan inactivo si se apaga el interruptor Activo", async () => {
    const { onSubmit, user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "BASIC" }));
    await user.type(screen.getByLabelText("Nombre"), "Basic");
    await user.type(screen.getByLabelText("Descripción"), "Plan basico");
    await user.click(screen.getByRole("switch", { name: "Activo" }));
    await user.click(screen.getByRole("button", { name: "Crear Plan" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(lastPayload(onSubmit)).toHaveProperty("active", false);
  });
});
