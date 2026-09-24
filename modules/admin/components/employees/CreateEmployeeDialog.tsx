"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createEmployeeService } from "../../services/userService";

const EMPLOYEE_ROLES = [
  { value: "ROLE_WAITER", label: "Mesero" },
  { value: "ROLE_CASHIER", label: "Cajero" },
  { value: "ROLE_TICKET_HANDLER", label: "Gestor de Tickets" },
] as const;

const employeeSchema = yup.object().shape({
  email: yup
    .string()
    .email("Email inválido")
    .required("El email es requerido"),
  password: yup
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "La contraseña no puede superar los 128 caracteres")
    .matches(/[a-z]/, "Debe contener al menos una minúscula")
    .matches(/[A-Z]/, "Debe contener al menos una mayúscula")
    .matches(/[0-9]/, "Debe contener al menos un número")
    .matches(/[.!@#$%^&*()_+\-=[\]{};':,<>?/~`|\\]/, "Debe contener al menos un carácter especial")
    .required("La contraseña es requerida"),
  firstName: yup.string().min(2, "Mínimo 2 caracteres").required("El nombre es requerido"),
  lastName: yup.string().min(2, "Mínimo 2 caracteres").required("El apellido es requerido"),
  role: yup.string().required("Debe seleccionar un rol"),
});

type EmployeeFormValues = yup.InferType<typeof employeeSchema>;

interface CreateEmployeeDialogProps {
  onEmployeeCreated: () => void;
}

export default function CreateEmployeeDialog({
  onEmployeeCreated,
}: CreateEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: yupResolver(employeeSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "",
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    try {
      await createEmployeeService({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: [data.role],
      });
      toast.success("Empleado creado exitosamente", {
        description:
          "Compartí la contraseña inicial con el empleado para que pueda iniciar sesión.",
      });
      onEmployeeCreated();
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        toast.error(error?.response?.data?.message || "Datos inválidos");
      } else if (status === 403) {
        toast.error("No tienes permisos para crear empleados");
      } else {
        toast.error("Error al crear empleado", {
          description: "Por favor, intente nuevamente.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Empleado</DialogTitle>
          <DialogDescription>
            Complete los datos del empleado y defina una contraseña inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Compartí la contraseña inicial con el empleado. Podrá cambiarla
            luego desde su cuenta.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="empleado@restaurante.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña inicial</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLOYEE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Empleado"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
