import api from "@/config/api.axios";

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

export const getAllEmployeesService = async (page: number, size: number, sort: string = "hireDate") => {
  const response = await api.get(`/employees?page=${page}&size=${size}&sort=${sort}`);
  return response.data.data;
};

export const getEmployeeByIdService = async (id: number) => {
  const response = await api.get(`/employees/${id}`);
  return response.data.data;
};

export const createEmployeeService = async (data: CreateEmployeeData) => {
  const response = await api.post("/employees", data);
  return response.data;
};

export const updateEmployeeService = async (id: number, data: Partial<CreateEmployeeData>) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployeeService = async (id: number) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};
