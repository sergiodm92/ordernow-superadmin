import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import {
  createPermissionService,
  deletePermissionService,
  getPermissionsService,
  updatePermissionService,
} from '../services/permissionService';
import { CreatePermissionDTO, UpdatePermissionDTO } from '../types/permission';

export const usePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissionsService,
  });

  const createPermission = useMutation({
    mutationFn: (data: CreatePermissionDTO) => createPermissionService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permiso creado',
        description: 'El permiso ha sido creado exitosamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Hubo un error al crear el permiso',
        variant: 'destructive',
      });
    },
  });

  const updatePermission = useMutation({
    mutationFn: (data: UpdatePermissionDTO) => updatePermissionService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permiso actualizado',
        description: 'El permiso ha sido actualizado exitosamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Hubo un error al actualizar el permiso',
        variant: 'destructive',
      });
    },
  });

  const deletePermission = useMutation({
    mutationFn: (id: string) => deletePermissionService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permiso eliminado',
        description: 'El permiso ha sido eliminado exitosamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Hubo un error al eliminar el permiso',
        variant: 'destructive',
      });
    },
  });

  return {
    permissions,
    isLoading,
    createPermission,
    updatePermission,
    deletePermission,
  };
};