import api from "@/config/api.axios";

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
}

export interface CreateEmployeeData {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface UpdateUserData {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[];
}


export const createUserService = async (createUserData: CreateUserData) => {
  // User creation data prepared
  const response = await api.post("/auth/register", createUserData);
  return response.data;
};

export const createEmployeeService = async (data: CreateEmployeeData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const updateUserService = async (updateUserData: UpdateUserData) => {
  const {id, ...data} = updateUserData;
  const response = await api.put(`/users/${id}`, data);
  return response.data; // Devuelve el token y los datos del usuario
};

export const getUsersService = async () => {
  const response = await api.get("/auth/users");
  return response.data; // Devuelve los datos del usuario autenticado
};

export const getAllUsersService = async (page: number, size: number) => {
  const response = await api.get(`/users/all?page=${page}&size=${size}`);
  return response.data.data; // Devuelve los datos del usuario autenticado
};

export const deleteUserService = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data; // Devuelve el token y los datos del usuario
};


