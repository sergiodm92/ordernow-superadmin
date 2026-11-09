import { describe, expect, it, vi } from "vitest";
import { configure, render, screen } from "@testing-library/react";

// Con los diálogos de Radix en jsdom, en frío o con la máquina cargada, 1 s de espera se queda corto.
vi.setConfig({ testTimeout: 30_000 });
configure({ asyncUtilTimeout: 5000 });

vi.mock("@/modules/admin/hooks/useFetchUsers", () => ({
  useFetchUsers: () => ({ fetchUsers: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/modules/admin/store/user", () => ({
  useUsersStore: () => ({
    users: [{ id: "owner-1", firstName: "Ana", lastName: "García", email: "ana@example.com" }],
  }),
}));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { EstablishmentDialog } from "@/modules/admin/components/establishments/EstablishmentDialog";
import type { IEstablishment } from "@/modules/admin/types/establishment";

const establishment: IEstablishment = {
  id: 12,
  name: "La Parrilla de Juan",
  country: "Argentina",
  state: "Buenos Aires",
  city: "La Plata",
  address: "Calle 7 1234",
  phone: "+54-221-4567890",
  email: "contacto@laparrilla.com",
  userOwnerId: "owner-1",
};

const props = { onOpenChange: vi.fn(), onSubmit: vi.fn() };
const field = (placeholder: string) => screen.getByPlaceholderText(placeholder) as HTMLInputElement;

describe("EstablishmentDialog: valores al editar", () => {
  it("abre en modo edición con los valores actuales del establecimiento", () => {
    render(<EstablishmentDialog {...props} open mode="edit" establishment={establishment} />);

    expect(field("Nombre del establecimiento")).toHaveValue("La Parrilla de Juan");
    expect(field("País")).toHaveValue("Argentina");
    expect(field("Estado")).toHaveValue("Buenos Aires");
    expect(field("Ciudad")).toHaveValue("La Plata");
    expect(field("Dirección")).toHaveValue("Calle 7 1234");
    expect(field("Teléfono")).toHaveValue("+54-221-4567890");
    expect(field("Email")).toHaveValue("contacto@laparrilla.com");
  });

  it("carga los valores aunque el diálogo ya estuviera montado sin establecimiento (la página lo monta siempre)", () => {
    const { rerender } = render(<EstablishmentDialog {...props} open={false} mode="create" />);

    rerender(<EstablishmentDialog {...props} open mode="edit" establishment={establishment} />);

    expect(field("Nombre del establecimiento")).toHaveValue("La Parrilla de Juan");
    expect(field("Email")).toHaveValue("contacto@laparrilla.com");
  });

  it("cambia a los valores de otro establecimiento cuando se edita otro", () => {
    const { rerender } = render(<EstablishmentDialog {...props} open mode="edit" establishment={establishment} />);

    rerender(
      <EstablishmentDialog
        {...props}
        open
        mode="edit"
        establishment={{ ...establishment, id: 13, name: "El Rincón", city: "Tandil" }}
      />
    );

    expect(field("Nombre del establecimiento")).toHaveValue("El Rincón");
    expect(field("Ciudad")).toHaveValue("Tandil");
  });

  it("al crear después de editar, el formulario vuelve vacío", () => {
    const { rerender } = render(<EstablishmentDialog {...props} open mode="edit" establishment={establishment} />);

    rerender(<EstablishmentDialog {...props} open mode="create" />);

    expect(field("Nombre del establecimiento")).toHaveValue("");
    expect(field("Email")).toHaveValue("");
  });

  it("no deja cambiar el propietario al editar: el backend rechaza userOwnerId en el PUT", () => {
    render(<EstablishmentDialog {...props} open mode="edit" establishment={establishment} />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("al crear sí deja elegir el propietario", () => {
    render(<EstablishmentDialog {...props} open mode="create" />);

    expect(screen.getByRole("combobox")).toBeEnabled();
  });
});
