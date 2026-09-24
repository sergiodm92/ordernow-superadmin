import api from "@/config/api.axios";

interface CreatePaymentMethodData {
  name: string;
  description: string;
  fee: number;
  isActive: boolean;
}

// The backend only exposes POST and GET for /payment-methods (no update/delete yet).
export const createPaymentMethodService = async (data: CreatePaymentMethodData) => {
  const response = await api.post("/payment-methods", data);
  return response.data.data;
};

export const getPaymentMethodsService = async () => {
  const response = await api.get("/payment-methods");
  return response.data.data;
};
