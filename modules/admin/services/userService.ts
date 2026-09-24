import api from "@/config/api.axios";
import { ApiBody, ApiData } from "@/types/api";

// Both hit POST /auth/register (RegisterDto) — kept as separate named aliases since callers use
// them for two distinct flows (super-admin user vs. establishment employee).
export type CreateUserData = ApiBody<"/api/v1/auth/register", "post">;
export type CreateEmployeeData = ApiBody<"/api/v1/auth/register", "post">;

export type UpdateUserData = ApiBody<"/api/v1/users/{id}", "put"> & { id: string };

export const createUserService = async (createUserData: CreateUserData) => {
  const response = await api.post<{ data: ApiData<"/api/v1/auth/register", "post"> }>(
    "/auth/register",
    createUserData
  );
  return response.data.data;
};

export const createEmployeeService = async (data: CreateEmployeeData) => {
  const response = await api.post<{ data: ApiData<"/api/v1/auth/register", "post"> }>(
    "/auth/register",
    data
  );
  return response.data.data;
};

export const updateUserService = async (updateUserData: UpdateUserData) => {
  const {id, ...data} = updateUserData;
  const response = await api.put<{ data: ApiData<"/api/v1/users/{id}", "put"> }>(`/users/${id}`, data);
  return response.data.data;
};

export const getAllUsersService = async (page: number, size: number) => {
  const response = await api.get<{ data: ApiData<"/api/v1/users/all", "get"> }>(
    `/users/all?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const deleteUserService = async (id: string) => {
  const response = await api.delete<{ data: ApiData<"/api/v1/users/{id}", "delete"> }>(`/users/${id}`);
  return response.data.data;
};

