"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RolesState {
  roles: string[];
  setRoles: (roles: string[]) => void;
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

