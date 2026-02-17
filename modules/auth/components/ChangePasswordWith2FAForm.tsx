"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./PasswordInput";
import {
  changePasswordWith2FASchema,
  verifyChangePasswordCodeSchema
} from "../validations/authValidation";
import {
  ChangePasswordWith2FAFormValues,
  VerifyChangePasswordCodeFormValues,
  ChangePasswordStep
} from "../types/changePasswordWith2FA";
import {
  requestChangePasswordWith2FAService,
  verifyChangePasswordCodeService
} from "../services/authService";
import { toast } from "sonner";
import { Lock, Mail, Shield, CheckCircle, ArrowLeft } from "lucide-react";

export const ChangePasswordWith2FAForm = () => {
  const [currentStep, setCurrentStep] = useState<ChangePasswordStep>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordWith2FAFormValues | null>(null);

  const passwordForm = useForm<ChangePasswordWith2FAFormValues>({
    resolver: yupResolver(changePasswordWith2FASchema),
    mode: "onChange",
  });

  const verifyForm = useForm<VerifyChangePasswordCodeFormValues>({
    resolver: yupResolver(verifyChangePasswordCodeSchema),
    mode: "onChange",
  });

  const handlePasswordSubmit = async (data: ChangePasswordWith2FAFormValues) => {
    setIsLoading(true);
    try {
      await requestChangePasswordWith2FAService({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setPasswordData(data);
      setCurrentStep("verify");
      toast.success("Código de verificación enviado a tu email");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error al solicitar cambio de contraseña";
      toast.error(errorMessage);
      console.error("Error requesting password change:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (data: VerifyChangePasswordCodeFormValues) => {
    if (!passwordData) return;

    setIsLoading(true);
    try {
      await verifyChangePasswordCodeService({
        code: data.code,
        newPassword: passwordData.newPassword,
      });

      setCurrentStep("success");
      toast.success("Contraseña cambiada exitosamente");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Código de verificación inválido";
      toast.error(errorMessage);
      console.error("Error verifying code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("password");
    setPasswordData(null);
    passwordForm.reset();
    verifyForm.reset();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "password":
        return (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <PasswordInput
                name="currentPassword"
                register={passwordForm.register}
                error={passwordForm.formState.errors.currentPassword?.message}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <PasswordInput
                name="newPassword"
                register={passwordForm.register}
                error={passwordForm.formState.errors.newPassword?.message}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <PasswordInput
                name="confirmPassword"
                register={passwordForm.register}
                error={passwordForm.formState.errors.confirmPassword?.message}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg">
              {isLoading ? "Enviando código..." : "Enviar código de verificación"}
            </Button>
          </form>
        );
      case "verify":
        return (
          <form onSubmit={verifyForm.handleSubmit(handleVerifySubmit)} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verificación por Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hemos enviado un código de 6 dígitos a tu correo electrónico.
                Ingrésalo a continuación para confirmar el cambio de contraseña.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-center block">Código de Verificación</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest h-14 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                {...verifyForm.register("code")}
              />
              {verifyForm.formState.errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{verifyForm.formState.errors.code.message}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setCurrentStep("password")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {isLoading ? "Verificando..." : "Verificar código"}
              </Button>
            </div>
          </form>
        );
      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">¡Contraseña cambiada exitosamente!</h3>
              <p className="text-gray-600 dark:text-gray-400">Tu contraseña ha sido actualizada correctamente.</p>
            </div>
            <Button onClick={resetForm} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Cambiar contraseña nuevamente
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case "password": return <Lock className="h-5 w-5" />;
      case "verify": return <Shield className="h-5 w-5" />;
      case "success": return <CheckCircle className="h-5 w-5" />;
      default: return <Lock className="h-5 w-5" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "password": return "Cambiar Contraseña";
      case "verify": return "Verificación 2FA";
      case "success": return "¡Completado!";
      default: return "Cambiar Contraseña";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "password": return "Ingresa tu contraseña actual y la nueva contraseña. Te enviaremos un código de verificación por email.";
      case "verify": return "Verifica tu identidad con el código enviado a tu email.";
      case "success": return "Tu contraseña ha sido actualizada con éxito.";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStepIcon()}
          {getStepTitle()}
        </CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
      </CardHeader>
      <CardContent>{renderStepContent()}</CardContent>
    </Card>
  );
};
