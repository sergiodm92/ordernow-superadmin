import api from "@/config/api.axios";
import { Role } from "@/modules/admin/types/role";
import { IEstablishment } from "../types/user";

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageURL?: string;
  };
  roles: Role[];
  establishments: IEstablishment[];
}

interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
  tokenExpiresIn: number;
  tokenType: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface RequestChangePasswordWith2FAData {
  currentPassword: string;
  newPassword: string;
}

interface VerifyChangePasswordCodeData {
  code: string;
  newPassword: string;
}

export const loginAdminService = async ({email, password}: LoginData): Promise<AuthResponse> => {
  const response = await api.post("/auth/admin/login", { email, password });
  return response.data.data;
};

export const refreshTokenService = async (refreshToken: string): Promise<TokenRefreshResponse> => {
  const response = await api.post(`/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`);
  return response.data.data;
};

export const getUserProfileService = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const logoutService = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const changePasswordService = async (data: ChangePasswordData) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

export const requestChangePasswordWith2FAService = async (data: RequestChangePasswordWith2FAData) => {
  const response = await api.post("/auth/change-password/request-2fa", data);
  return response.data;
};

export const verifyChangePasswordCodeService = async (data: VerifyChangePasswordCodeData) => {
  const response = await api.post("/auth/change-password/verify-2fa", data);
  return response.data;
};
