import api from "@/config/api.axios";
import { CreateRoleDto, Role, UpdateRoleDto } from "../types/role";

export const getRolesService = async (): Promise<Role[]> => {
  const response = await api.get("/roles");
  return response.data.data;
};

export const createRoleService = async (data: CreateRoleDto): Promise<Role> => {
  const { permissions, ...rest } = data;
  const response = await api.post("/roles", {
    ...rest,
    permissionIds: permissions,
  });
  return response.data.data;
};

export const updateRoleService = async (data: UpdateRoleDto): Promise<Role> => {
  const response = await api.put(`/roles/${data.id}`, {
    name: data.name,
    description: data.description,
    permissionIds: data.permissions,
  });
  return response.data.data;
};

export const deleteRoleService = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};