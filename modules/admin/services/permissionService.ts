import api from "@/config/api.axios";
import { ApiData } from "@/types/api";
import { CreatePermissionDTO, PermissionDTO, UpdatePermissionDTO } from "../types/permission";

export const getPermissionsService = async (): Promise<PermissionDTO[]> => {
  const response = await api.get<{ data: ApiData<"/api/v1/permissions", "get"> }>("/permissions");
  return response.data.data;
};

export const createPermissionService = async (data: CreatePermissionDTO): Promise<PermissionDTO> => {
  const response = await api.post<{ data: ApiData<"/api/v1/permissions", "post"> }>("/permissions", data);
  return response.data.data;
};

export const updatePermissionService = async (data: UpdatePermissionDTO): Promise<PermissionDTO> => {
  const response = await api.put<{ data: ApiData<"/api/v1/permissions/{id}", "put"> }>(
    `/permissions/${data.id}`,
    {
      name: data.name,
      description: data.description,
    }
  );
  return response.data.data;
};

export const deletePermissionService = async (id: string): Promise<void> => {
  await api.delete(`/permissions/${id}`);
};