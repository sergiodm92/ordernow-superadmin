import { create } from 'zustand';
import { PermissionDTO } from '../types/permission';

interface PermissionsState {
  permissions: PermissionDTO[];
  setPermissions: (permissions: PermissionDTO[]) => void;
  addPermission: (permission: PermissionDTO) => void;
  updatePermission: (permission: PermissionDTO) => void;
  removePermission: (id: string) => void;
}

export const usePermissionsStore = create<PermissionsState>()((set) => ({
  permissions: [],
  setPermissions: (permissions) => set({ permissions }),
  addPermission: (permission) =>
    set((state) => ({
      permissions: [...state.permissions, permission],
    })),
  updatePermission: (permission) =>
    set((state) => ({
      permissions: state.permissions.map((p) =>
        p.id === permission.id ? permission : p
      ),
    })),
  removePermission: (id) =>
    set((state) => ({
      permissions: state.permissions.filter((p) => p.id !== id),
    })),
}));