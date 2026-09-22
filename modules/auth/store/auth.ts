import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { IUser } from "../types/user";
import { Role } from "@/modules/admin/types/role";

interface AuthState {
  user: IUser | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresIn: number | null;
  login: (token: string, refreshToken: string, tokenExpiresIn: number, user: IUser) => void;
  updateTokens: (token: string, refreshToken: string, tokenExpiresIn: number) => void;
  logout: () => void;
  roles: Role[];
  // Getters computados
  isSuperAdmin: () => boolean;
  userRoles: () => Role[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresIn: null,
      roles: [],

      login: (token, refreshToken, tokenExpiresIn, user) => {
        // Cookie mínima para el middleware (evita superar 4KB por cookie del navegador).
        // El objeto user completo (con permisos) queda en localStorage vía Zustand persist.
        const cookieData = {
          token,
          user: { roles: (user.roles || []).map((r) => ({ name: r.name })) },
        };
        Cookies.set("auth-storage", JSON.stringify(cookieData));

        set({
          token,
          refreshToken,
          tokenExpiresIn,
          user,
          roles: user.roles || [],
        });
      },

      updateTokens: (token, refreshToken, tokenExpiresIn) => {
        const existing = JSON.parse(Cookies.get("auth-storage") || "{}");
        Cookies.set("auth-storage", JSON.stringify({ ...existing, token }));
        set({ token, refreshToken, tokenExpiresIn });
      },

      logout: () => {
        try {
          Cookies.remove("auth-storage");
          localStorage.removeItem("auth-storage");

          set({
            user: null,
            token: null,
            refreshToken: null,
            tokenExpiresIn: null,
            roles: []
          });
        } catch (error) {
          console.error('[AuthStore] Error during logout:', error);

          try {
            Cookies.remove("auth-storage");
            localStorage.removeItem("auth-storage");
          } catch (cleanupError) {
            console.error('[AuthStore] Error during cleanup:', cleanupError);
          }

          set({
            user: null,
            token: null,
            refreshToken: null,
            tokenExpiresIn: null,
            roles: []
          });
        }
      },

      // Getters computados
      isSuperAdmin: () => {
        const state = get();
        return state.user?.roles.some(role => role.name === "ROLE_SUPER_ADMIN") ?? false;
      },

      userRoles: () => {
        const state = get();
        return state.user?.roles ?? [];
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Auth store rehydration failed:', error);
          }
        };
      },
    }
  )
);
