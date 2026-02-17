import api from "@/config/api.axios";

interface CreatePaymentMethodData {
  name: string;
  description: string;
}


export const createPaymentMethodService = async ({ name, description }: CreatePaymentMethodData) => {
  const response = await api.post("/admin/payment-methods", { name, description });
  return response.data; // Devuelve el token y los datos del usuario
};

export const updatePaymentMethodService = async ({ name, description }: CreatePaymentMethodData) => {
  const response = await api.put("/admin/payment-methods", { name, description });
  return response.data; // Devuelve el token y los datos del usuario
};

export const getPaymentMethodsService = async () => {
  const response = await api.get("/admin/payment-methods");
  return response.data; // Devuelve los datos del usuario autenticado
};

export const deletePaymentMethodService = async (id: string) => {
  const response = await api.delete(`/admin/payment-methods/${id}`);
  return response.data; // Devuelve el token y los datos del usuario
};