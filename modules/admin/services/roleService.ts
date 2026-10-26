import api from "@/config/api.axios";
import { ApiBody, ApiData } from "@/types/api";
import { CreateRoleDto, Role, UpdateRoleDto } from "../types/role";

export const getRolesService = async (): Promise<Role[]> => {
  const response = await api.get<{ data: ApiData<"/api/v1/roles", "get"> }>("/roles");
  return response.data.data;
};

export const createRoleService = async (data: CreateRoleDto): Promise<Role> => {
  const { permissions, ...rest } = data;
  const body: ApiBody<"/api/v1/roles", "post"> = {
    ...rest,
    permissionIds: permissions,
  };
  const response = await api.post<{ data: ApiData<"/api/v1/roles", "post"> }>("/roles", body);
  return response.data.data;
};

export const updateRoleService = async (data: UpdateRoleDto): Promise<Role> => {
  const body: ApiBody<"/api/v1/roles/{id}", "put"> = {
    name: data.name,
    description: data.description,
    permissionIds: data.permissions,
  };
  const response = await api.put<{ data: ApiData<"/api/v1/roles/{id}", "put"> }>(`/roles/${data.id}`, body);
  return response.data.data;
};

export const deleteRoleService = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};