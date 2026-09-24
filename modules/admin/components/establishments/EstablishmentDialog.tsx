"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { IEstablishment } from "@/modules/admin/types/establishment";
import { useFetchUsers } from "@/modules/admin/hooks/useFetchUsers";
import { useUsersStore } from "@/modules/admin/store/user";
import { useToast } from "@/hooks/useToast";

const establishmentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  country: z.string().min(1, "El país es requerido"),
  state: z.string().min(1, "El estado es requerido"),
  city: z.string().min(1, "La ciudad es requerida"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("El email debe ser válido"),
  userOwnerId: z.string().min(1, "El propietario es requerido"),
});

type EstablishmentFormValues = z.infer<typeof establishmentSchema>;

interface EstablishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EstablishmentFormValues) => void;
  establishment?: IEstablishment;
  mode: "create" | "edit";
}

export function EstablishmentDialog({
  open,
  onOpenChange,
  onSubmit,
  establishment,
  mode,
}: EstablishmentDialogProps) {
  const { users } = useUsersStore();
  const { fetchUsers } = useFetchUsers(0, 100); // Fetch first 100 users
  const { toast } = useToast();

  const form = useForm<EstablishmentFormValues>({
    resolver: zodResolver(establishmentSchema),
    defaultValues: {
      name: establishment?.name || "",
      country: establishment?.country || "",
      state: establishment?.state || "",
      city: establishment?.city || "",
      address: establishment?.address || "",
      phone: establishment?.phone || "",
      email: establishment?.email || "",
      userOwnerId: establishment?.userOwnerId || "",
    },
  });

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers().catch(() => {
        toast({
          title: "Error",
          description: "No se pudo cargar la lista de propietarios. Reintentá abriendo el diálogo de nuevo.",
          variant: "destructive",
        });
      });
    }
  }, [open, fetchUsers, toast]);

  // Transform users into combobox options
  const userOptions: ComboboxOption[] = useMemo(
    () =>
      users.map(user => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName} (${user.email})`,
      })),
    [users],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Establecimiento" : "Editar Establecimiento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los campos para crear un nuevo establecimiento"
              : "Modifica los campos para actualizar el establecimiento"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del establecimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input placeholder="País" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propietario</FormLabel>
                  <FormControl>
                    <Combobox
                      options={userOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar propietario..."
                      searchPlaceholder="Buscar usuario..."
                      emptyText="No se encontraron usuarios."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {mode === "create" ? "Crear" : "Actualizar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}