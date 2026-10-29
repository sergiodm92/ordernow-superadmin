"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { UpdateUserData, updateUserService } from "../../services/userService";
import { AdminUser } from "../../store/user";
import { Pencil } from "lucide-react"
import { useState } from "react";

const schema = yup.object().shape({
  email: yup.string().email("Correo electrónico inválido").required("El correo electrónico es requerido"),
  firstName: yup.string().required("El nombre es requerido"),
  lastName: yup.string().required("El apellido es requerido"),
  phoneNumber: yup.string().required("El teléfono es requerido"),
  roles: yup.array().min(1, "Debe seleccionar al menos un rol").required("El rol es requerido"),
});

interface EditUserDialogProps {
  user: AdminUser;
  roles: any[];
  onSuccess: () => void;
}

export function EditUserDialog({ user, roles, onSuccess }: EditUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || "",
      roles: user.roles.map(role => role.name)
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUserService,
    onSuccess: () => {
      toast.success("¡Usuario actualizado exitosamente!");
      setIsOpen(false);
      onSuccess();
      form.reset();
    },
    onError: () => {
      toast.error("Error al actualizar usuario. Por favor, intente nuevamente.");
    },
  });

  const onSubmit = (data: any) => {
    updateUserMutation.mutate({
      id: user.id,
      ...data,
    });
  };


  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog
      open={isOpen} onOpenChange={handleDialogChange}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} />
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
                    <Input placeholder="John" {...field} />
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
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg">
                    {roles.map((role) => {
                      const roleName = typeof role === 'string' ? role : role.name;
                      return (
                        <div key={roleName} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(roleName)}
                            onCheckedChange={(checked) => {
                              const updatedRoles = checked
                                ? [...(field.value || []), roleName]
                                : (field.value || []).filter((name: string) => name !== roleName);
                              field.onChange(updatedRoles);
                            }}
                          />
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {roleName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Guardar cambios
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}