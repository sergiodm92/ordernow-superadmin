import api from "@/config/api.axios";
import { CreatePermissionDTO, PermissionDTO } from "../types/permission";

export const getPermissionsService = async (): Promise<PermissionDTO[]> => {
  const response = await api.get("/permissions");
  return response.data.data;
};

export const createPermissionService = async (data: CreatePermissionDTO): Promise<PermissionDTO> => {
  const response = await api.post("/permissions", data);
  return response.data.data;
};

export const updatePermissionService = async (data: PermissionDTO): Promise<PermissionDTO> => {
  const response = await api.put(`/permissions/${data.id}`, {
    name: data.name,
    description: data.description,
  });
  return response.data.data;
};

export const deletePermissionService = async (id: string): Promise<void> => {
  await api.delete(`/permissions/${id}`);
};