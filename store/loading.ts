import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  loadingMessage: 'Cargando...',
  showLoading: (message = 'Cargando...') => set({ isLoading: true, loadingMessage: message }),
  hideLoading: () => set({ isLoading: false })
}));
