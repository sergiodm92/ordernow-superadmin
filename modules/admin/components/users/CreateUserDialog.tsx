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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createUserService } from "../../services/userService";

const userSchema = yup.object().shape({
  firstName: yup.string().required("El nombre es requerido"),
  lastName: yup.string().required("El apellido es requerido"),
  email: yup.string().email("Email inválido").required("El email es requerido"),
  phoneNumber: yup.string().required("El teléfono es requerido"),
  roles: yup.array().min(1, "Debe seleccionar al menos un rol").required("El rol es requerido")
});

type UserFormValues = yup.InferType<typeof userSchema>;

interface CreateUserDialogProps {
  roles: any[];
  onUserCreated: () => void;
}

export default function CreateUserDialog({ roles, onUserCreated }: CreateUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const password = '  ';

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<UserFormValues>({
    resolver: yupResolver(userSchema)
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      await createUserService({
        ...data,
        password: password
      });
      toast.success("¡Usuario creado exitosamente!", {
        description: "El usuario recibirá un correo con sus credenciales."
      });
      onUserCreated();
      setIsOpen(false);
      reset();
      setSelectedRoles([]);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error al crear usuario", {
        description: "Por favor, intente nuevamente."
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setSelectedRoles([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will receive an email to set their password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <span className="text-sm text-red-500">{errors.firstName.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <span className="text-sm text-red-500">{errors.lastName.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+1234567890"
              {...register("phoneNumber")}
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && (
              <span className="text-sm text-red-500">{errors.phoneNumber.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="roles">Roles</Label>
            <div className="border rounded-md p-4">
              {roles.map((role) => {
                const roleName = typeof role === 'string' ? role : role.name;
                return (
                  <div key={roleName} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id={`role-${roleName}`}
                      checked={selectedRoles.includes(roleName)}
                      onChange={(e) => {
                        const updatedRoles = e.target.checked
                          ? [...selectedRoles, roleName]
                          : selectedRoles.filter((r) => r !== roleName);
                        setSelectedRoles(updatedRoles);
                        setValue("roles", updatedRoles);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`role-${roleName}`} className="text-sm font-medium">
                      {roleName}
                    </label>
                  </div>
                );
              })}
            </div>
            {errors.roles && (
              <span className="text-sm text-red-500">{errors.roles.message}</span>
            )}
          </div>
          <Button type="submit" className="w-full">Crear Usuario</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}