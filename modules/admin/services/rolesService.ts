import api from "@/config/api.axios";

interface CreateRoleData {
  name: string;
  description: string;
}


export const createRoleService = async ({ name, description }: CreateRoleData) => {
  const response = await api.post("/roles", { name, description });
  return response.data; // Devuelve el token y los datos del usuario
};

export const updateRoleService = async ({ name, description }: CreateRoleData) => {
  const response = await api.put("/roles", { name, description });
  
  return response.data; // Devuelve el token y los datos del usuario
};

export const getAllRolesService = async () => {
  const response = await api.get("/roles");
  return response.data.data; // Devuelve los datos del usuario autenticado
};


export const deleteRoleService = async (id: string) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data; // Devuelve el token y los datos del usuario
};