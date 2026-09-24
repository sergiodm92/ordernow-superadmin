import api from "@/config/api.axios";
import { IEmployee } from "../types/employee";

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  position: string;
  department?: string;
  hireDate?: string;
  salary?: number;
  establishmentId: number;
}

// Employee.id and establishment FK are Postgres bigints, serialized as strings.
const toEmployee = (raw: IEmployee): IEmployee => ({
  ...raw,
  id: Number(raw.id),
  establishmentId: raw.establishmentId != null ? Number(raw.establishmentId) : raw.establishmentId,
});

export const getAllEmployeesService = async (page: number, size: number, sort: string = "hireDate,desc") => {
  const response = await api.get(`/employees?page=${page}&size=${size}&sort=${sort}`);
  const pageResult = response.data.data;
  return {
    ...pageResult,
    content: Array.isArray(pageResult.content) ? pageResult.content.map(toEmployee) : [],
  };
};

export const getEmployeeByIdService = async (id: number) => {
  const response = await api.get(`/employees/${id}`);
  return toEmployee(response.data.data);
};

export const createEmployeeService = async (data: CreateEmployeeData) => {
  const response = await api.post("/employees", data);
  return response.data.data;
};

export const updateEmployeeService = async (id: number, data: Partial<CreateEmployeeData>) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data.data;
};

export const deleteEmployeeService = async (id: number) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data.data;
};
