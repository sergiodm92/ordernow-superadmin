"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "../types/role";

interface RolesState {
  roles: Role[];
  setRoles: (roles: Role[]) => void;
}

export const useRolesStore = create<RolesState>()(
  persist(
    (set) => ({
      roles: [],
      setRoles: (roles) => set({ roles }),
      
    }),

    {
      name: "roles-storage", // Clave en localStorage
      getStorage: () => localStorage, // Usa localStorage
    }
  )
);

