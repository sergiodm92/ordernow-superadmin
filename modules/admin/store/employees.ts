"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IEmployee } from "@/modules/admin/types/employee";

interface EmployeesStore {
  employees: IEmployee[];
  totalElements: number;
  totalPages: number;
  setEmployees: (employees: IEmployee[]) => void;
  setTotalElements: (total: number) => void;
  setTotalPages: (pages: number) => void;
}

export const useEmployeesStore = create<EmployeesStore>()(
  persist(
    (set) => ({
      employees: [],
      totalElements: 0,
      totalPages: 0,
      setEmployees: (employees) => set({ employees }),
      setTotalElements: (total) => set({ totalElements: total }),
      setTotalPages: (pages) => set({ totalPages: pages }),
    }),
    {
      name: "employees-storage",
      getStorage: () => localStorage,
    }
  )
);
