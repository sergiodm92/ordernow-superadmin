"use client";

import { RolesTable } from "@/modules/admin/components/roles/RolesTable";
import { RoleDialog } from "@/modules/admin/components/roles/RoleDialog";
import { useRoles } from "@/modules/admin/hooks/useRoles";
import { Role } from "@/modules/admin/types/role";
import { useState, useEffect } from "react";
import { useLoadingStore } from "@/store/loading";

export default function RolesPage() {
  const { roles, isLoading, createRole, updateRole, deleteRole } = useRoles();
  const { showLoading, hideLoading } = useLoadingStore();
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    if (isLoading) {
      showLoading('Cargando roles...');
    } else {
      hideLoading();
    }
  }, [isLoading, showLoading, hideLoading]);

  if (isLoading) {
    return null;
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleUpdateRole = async (data: any) => {
    if (editingRole) {
      await updateRole.mutateAsync({
        id: editingRole.id,
        ...data,
      });
      setEditingRole(null);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    await deleteRole.mutateAsync(roleId);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
        <RoleDialog
          title="Crear Role"
          onSubmit={async (data) => {
            await createRole.mutateAsync(data);
          }}
        />
      </div>

      <RolesTable
        roles={roles}
        onEdit={handleEditRole}
        onDelete={handleDeleteRole}
      />

      {editingRole && (
        <RoleDialog
          role={editingRole}
          title="Editar Role"
          onSubmit={handleUpdateRole}
          onClose={() => setEditingRole(null)}
          trigger={null}
        />
      )}
    </div>
  );
}
