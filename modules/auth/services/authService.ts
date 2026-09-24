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
  confirmPassword: string;
  twoFactorCode: string;
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
    // Establishment.id is a Postgres bigint, serialized as a string.
    establishments: (raw.establishments ?? []).map((e: IEstablishment) => ({
      ...e,
      id: Number(e.id),
    })),
  };
};

export const refreshTokenService = async (refreshToken: string): Promise<TokenRefreshResponse> => {
  const response = await api.post("/auth/refresh-token", { refreshToken });
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
  const response = await api.get("/users/me");
  return response.data.data;
};

export const logoutService = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// POST /auth/change-password validates currentPassword + a PASSWORD_CHANGE 2FA code
// in a single call — request the code first via requestPasswordChangeCodeService.
export const changePasswordService = async (data: ChangePasswordData) => {
  const response = await api.post("/auth/change-password", data);
  return response.data;
};

export const requestPasswordChangeCodeService = async () => {
  const response = await api.post("/auth/2fa/generate", {
    verificationType: "PASSWORD_CHANGE",
  });
  return response.data;
};
