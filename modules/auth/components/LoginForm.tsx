"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Label, Input } from "@ui/index";
import { useLogin } from "@auth/hooks/useLogin";
import { loginSchema } from "@auth/validations/authValidation";
import { PasswordInput } from "./PasswordInput";
import { LoginFormValues } from "../types/login";
import { ArrowLeft, Mail, Lock, Shield } from "lucide-react";

export const LoginForm = () => {
  const { handleLogin, isLoading } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    handleLogin(data.email, data.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-200/30 dark:bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 dark:border-purple-900/50 p-8">
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-center">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Super Admin
              </h2>
              <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                Panel de Administración del Sistema
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="superadmin@ordernow.com"
                    {...register("email")}
                    className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:focus:border-purple-400 dark:focus:ring-purple-400"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <PasswordInput
                    error={errors.password?.message}
                    register={register}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando acceso...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    Acceder al Panel
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-xs text-center text-purple-700 dark:text-purple-300">
                <Shield className="inline h-3 w-3 mr-1" />
                Acceso restringido solo para Super Administradores del sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
