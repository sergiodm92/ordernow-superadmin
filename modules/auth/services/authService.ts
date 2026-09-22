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

// Decodifica el payload de un JWT y calcula segundos hasta la expiración
const getTokenExpiresIn = (jwt: string): number => {
  try {
    const [, payloadB64] = jwt.split(".");
    const payload = JSON.parse(
      typeof window === "undefined"
        ? Buffer.from(payloadB64, "base64").toString("utf-8")
        : atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (typeof payload.exp === "number") {
      return payload.exp - Math.floor(Date.now() / 1000);
    }
  } catch {
    // ignore
  }
  return 3600;
};

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
  const raw = response.data.data;

  const token: string = raw.accessToken ?? raw.token;
  const refreshToken: string = raw.refreshToken;
  const backendUser = raw.user ?? {};

  return {
    token,
    refreshToken,
    tokenExpiresIn: getTokenExpiresIn(token),
    user: {
      id: backendUser.id,
      email: backendUser.email,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      imageURL: backendUser.imageUrl ?? backendUser.imageURL ?? undefined,
    },
    roles: backendUser.roles ?? raw.roles ?? [],
    establishments: raw.establishments ?? [],
  };
};

export const refreshTokenService = async (refreshToken: string): Promise<TokenRefreshResponse> => {
  const response = await api.post(`/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`);
  const raw = response.data.data;
  const token: string = raw.accessToken ?? raw.token;

  return {
    token,
    refreshToken: raw.refreshToken,
    tokenExpiresIn: getTokenExpiresIn(token),
    tokenType: raw.tokenType ?? "Bearer",
  };
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
