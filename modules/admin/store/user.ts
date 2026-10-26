"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Schemas } from "@/types/api";

// GET /users/all returns the full backend User entity (not the composite auth/types/user.ts
// IUser, which is a hand-mapped shape built only from the login response) — see
// modules/admin/services/userService.ts.
export type AdminUser = Schemas["User"];

interface UsersStore{
    users: AdminUser[];
    totalElements: number;
    setUsers: (users: AdminUser[]) => void;
    setTotalElements: (total: number) => void;
}

export const useUsersStore = create<UsersStore>()(
    persist(
        (set) => ({
            users: [],
            totalElements: 0,
            setUsers: (users) => set({ users }),
            setTotalElements: (total) => set({ totalElements: total }),
            addUser: (user: AdminUser) => {
                set((state) => ({
                    users: [...state.users, user],
                }));
            },
        }),
        
        {
            name: "users-storage", // Clave en localStorage
            getStorage: () => localStorage, // Usa localStorage
        }
    )
);