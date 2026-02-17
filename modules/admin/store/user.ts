"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from "@/modules/auth/types/user";


interface UsersStore{
    users: IUser[];
    totalElements: number;
    setUsers: (users: IUser[]) => void;
    setTotalElements: (total: number) => void;
}

export const useUsersStore = create<UsersStore>()(
    persist(
        (set) => ({
            users: [],
            totalElements: 0,
            setUsers: (users) => set({ users }),
            setTotalElements: (total) => set({ totalElements: total }),
            addUser: (user: IUser) => {
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