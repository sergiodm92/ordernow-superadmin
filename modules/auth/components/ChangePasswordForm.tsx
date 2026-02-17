"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { changePasswordSchema } from "../validations/authValidation";
import { ChangePasswordFormValues } from "../types/changePassword";
import { changePasswordService } from "../services/authService";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export const ChangePasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsLoading(true);
    try {
      await changePasswordService({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success("Contraseña cambiada exitosamente");
      reset();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error al cambiar la contraseña";
      toast.error(errorMessage);
      console.error("Error changing password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Cambiar Contraseña
        </CardTitle>
        <CardDescription>
          Actualiza tu contraseña para mantener tu cuenta segura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <PasswordInput
              name="currentPassword"
              register={register}
              error={errors.currentPassword?.message}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <PasswordInput
              name="newPassword"
              register={register}
              error={errors.newPassword?.message}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <PasswordInput
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword?.message}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
