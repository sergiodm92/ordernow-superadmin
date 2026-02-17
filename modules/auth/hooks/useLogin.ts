"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { loginAdminService } from "@auth/services/authService";
import { useAuthStore } from "@auth/store/auth";
import { IUser } from "../types/user";
import { AxiosError } from "axios";

export const useLogin = () => {
  const router = useRouter();
  const { login: loginStore } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginAdminService,
    onSuccess: (response) => {
      const user: IUser = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        imageURL: response.user.imageURL,
        emailVerified: false,
        establishments: response.establishments || [],
        roles: response.roles,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      const { token, refreshToken, tokenExpiresIn } = response;
      loginStore(token, refreshToken, tokenExpiresIn, user);

      router.push("/dashboard");
    },
    onError: (error: AxiosError<any>, variables) => {
      const errorCode = error?.response?.data?.code;

      if (errorCode === "ACCOUNT_DISABLED" && variables?.email) {
        toast.info("Verificación de email requerida", {
          description: "Tu cuenta necesita verificación de email para activarse.",
        });
        return;
      }

      if (error.response?.status === 403) {
        toast.error("Acceso denegado", {
          description: "No tienes permisos de Super Administrador.",
        });
      } else {
        toast.error("Error de autenticación", {
          description: "Credenciales incorrectas o no tienes permisos de Super Administrador",
        });
      }
    },
  });

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

  return { handleLogin, isLoading: loginMutation.isPending };
};
