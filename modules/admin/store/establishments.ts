import { create } from "zustand";
import { IEstablishment } from "../types/establishment";

interface EstablishmentsState {
  establishments: IEstablishment[];
  setEstablishments: (establishments: IEstablishment[]) => void;
  addEstablishment: (establishment: IEstablishment) => void;
  updateEstablishment: (id: number, updatedEstablishment: IEstablishment) => void;
  removeEstablishment: (id: number) => void;
}

export const useEstablishmentsStore = create<EstablishmentsState>((set) => ({
  establishments: [],
  setEstablishments: (establishments) => set({ establishments }),
  addEstablishment: (establishment) =>
    set((state) => ({
      establishments: [...state.establishments, establishment],
    })),
  updateEstablishment: (id, updatedEstablishment) =>
    set((state) => ({
      establishments: state.establishments.map((establishment) =>
        establishment.id === id ? updatedEstablishment : establishment
      ),
    })),
  removeEstablishment: (id) =>
    set((state) => ({
      establishments: state.establishments.filter(
        (establishment) => establishment.id !== id
      ),
    })),
}));