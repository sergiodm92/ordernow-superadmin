import api from "@/config/api.axios";
import { ApiBody, ApiData } from "@/types/api";

export type CreatePaymentMethodData = ApiBody<"/api/v1/payment-methods", "post">;

// The backend only exposes POST and GET for /payment-methods (no update/delete yet).
export const createPaymentMethodService = async (data: CreatePaymentMethodData) => {
  const response = await api.post<{ data: ApiData<"/api/v1/payment-methods", "post"> }>(
    "/payment-methods",
    data
  );
  return response.data.data;
};

export const getPaymentMethodsService = async () => {
  const response = await api.get<{ data: ApiData<"/api/v1/payment-methods", "get"> }>("/payment-methods");
  return response.data.data;
};
