import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRoleService,
  deleteRoleService,
  getRolesService,
  updateRoleService,
} from "../services/roleService";
import { CreateRoleDto, UpdateRoleDto } from "../types/role";

export const useRoles = () => {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRolesService,
  });

  const createRole = useMutation({
    mutationFn: (data: CreateRoleDto) => createRoleService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const updateRole = useMutation({
    mutationFn: (data: UpdateRoleDto) => updateRoleService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => deleteRoleService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  return {
    roles,
    isLoading,
    createRole,
    updateRole,
    deleteRole,
  };
};