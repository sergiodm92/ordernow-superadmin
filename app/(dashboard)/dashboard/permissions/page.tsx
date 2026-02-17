'use client';

import { usePermissions } from '@/modules/admin/hooks/usePermissions';
import { PermissionDialog } from '@/modules/admin/components/permissions/PermissionDialog';
import { PermissionsTable } from '@/modules/admin/components/permissions/PermissionsTable';
import { PermissionDTO } from '@/modules/admin/types/permission';
import { useEffect } from 'react';
import { useLoadingStore } from '@/store/loading';

export default function PermissionsPage() {
  const { permissions, isLoading, createPermission, updatePermission, deletePermission } = usePermissions();
  const { showLoading, hideLoading } = useLoadingStore();

  useEffect(() => {
    if (isLoading) {
      showLoading('Cargando permisos...');
    } else {
      hideLoading();
    }
  }, [isLoading, showLoading, hideLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Permisos</h2>
        <PermissionDialog
          title="Crear Permiso"
          onSubmit={async (data) => {
            await createPermission.mutateAsync(data);
          }}
        />
      </div>

      <PermissionsTable
        permissions={permissions}
        onEdit={(permission: PermissionDTO) => (
          <PermissionDialog
            title="Editar Permiso"
            permission={permission}
            onSubmit={async (data) => {
              await updatePermission.mutateAsync({
                ...data,
                id: permission.id,
              });
            }}
          />
        )}
        onDelete={async (id: string) => {
          await deletePermission.mutateAsync(id);
        }}
      />
    </div>
  );
}
