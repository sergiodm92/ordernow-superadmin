import api from "@/config/api.axios";
import { ApiBody, ApiData } from "@/types/api";
import { IEmployee } from "../types/employee";

export type CreateEmployeeData = ApiBody<"/api/v1/employees", "post">;

// Employee.id and establishment FK are Postgres bigints, serialized as strings.
const toEmployee = (raw: IEmployee): IEmployee => ({
  ...raw,
  id: Number(raw.id),
  establishmentId: raw.establishmentId != null ? Number(raw.establishmentId) : raw.establishmentId,
});

export const getAllEmployeesService = async (page: number, size: number, sort: string = "hireDate,desc") => {
  const response = await api.get<{ data: ApiData<"/api/v1/employees", "get"> }>(
    `/employees?page=${page}&size=${size}&sort=${sort}`
  );
  const pageResult = response.data.data;
  return {
    ...pageResult,
    content: Array.isArray(pageResult.content) ? pageResult.content.map(toEmployee) : [],
  };
};

export const getEmployeeByIdService = async (id: number) => {
  const response = await api.get<{ data: ApiData<"/api/v1/employees/{id}", "get"> }>(`/employees/${id}`);
  return toEmployee(response.data.data);
};

export const createEmployeeService = async (data: CreateEmployeeData) => {
  const response = await api.post<{ data: ApiData<"/api/v1/employees", "post"> }>("/employees", data);
  return response.data.data;
};

export const updateEmployeeService = async (
  id: number,
  data: ApiBody<"/api/v1/employees/{id}", "put">
) => {
  const response = await api.put<{ data: ApiData<"/api/v1/employees/{id}", "put"> }>(`/employees/${id}`, data);
  return response.data.data;
};

export const deleteEmployeeService = async (id: number) => {
  const response = await api.delete<{ data: ApiData<"/api/v1/employees/{id}", "delete"> }>(`/employees/${id}`);
  return response.data.data;
};
