import api from "@/config/api.axios";
import { ApiBody, ApiData, ApiRawBody, Schemas } from "@/types/api";
import { Role } from "@/modules/admin/types/role";
import { IEstablishment } from "../types/user";

type LoginData = ApiBody<"/api/v1/auth/admin/login", "post">;

type RawAuthResponse = Schemas["AuthResponseDto"];

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

type ChangePasswordData = ApiBody<"/api/v1/auth/change-password", "post">;

export const loginAdminService = async ({email, password}: LoginData): Promise<AuthResponse> => {
  const response = await api.post<{ data: RawAuthResponse }>("/auth/admin/login", { email, password });
  const raw = response.data.data;
  const backendUser = raw.user;

  return {
    token: raw.accessToken,
    refreshToken: raw.refreshToken,
    tokenExpiresIn: getTokenExpiresIn(raw.accessToken),
    user: {
      id: backendUser.id,
      email: backendUser.email,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      imageURL: backendUser.imageUrl ?? undefined,
    },
    roles: backendUser.roles,
    // Establishment.id is a Postgres bigint, serialized as a string.
    establishments: raw.establishments.map((e) => ({
      ...e,
      id: Number(e.id),
    })),
  };
};

export const refreshTokenService = async (refreshToken: string): Promise<TokenRefreshResponse> => {
  const response = await api.post<{ data: RawAuthResponse }>("/auth/refresh-token", { refreshToken });
  const raw = response.data.data;

  return {
    token: raw.accessToken,
    refreshToken: raw.refreshToken,
    tokenExpiresIn: getTokenExpiresIn(raw.accessToken),
    // AuthResponsePayload has no tokenType field — the backend always issues Bearer tokens.
    tokenType: "Bearer",
  };
};

export const getUserProfileService = async () => {
  const response = await api.get<{ data: ApiData<"/api/v1/users/me", "get"> }>("/users/me");
  return response.data.data;
};

export const logoutService = async () => {
  const response = await api.post<ApiRawBody<"/api/v1/auth/logout", "post">>("/auth/logout");
  return response.data;
};

// POST /auth/change-password validates currentPassword + a PASSWORD_CHANGE 2FA code
// in a single call — request the code first via requestPasswordChangeCodeService.
export const changePasswordService = async (data: ChangePasswordData) => {
  const response = await api.post<ApiRawBody<"/api/v1/auth/change-password", "post">>(
    "/auth/change-password",
    data
  );
  return response.data;
};

export const requestPasswordChangeCodeService = async () => {
  // /auth/2fa/generate is x-raw-response (not wrapped in the {success,message,data} envelope).
  const response = await api.post<ApiRawBody<"/api/v1/auth/2fa/generate", "post">>("/auth/2fa/generate", {
    verificationType: "PASSWORD_CHANGE",
  });
  return response.data;
};
