import api from "@/config/api.axios";
import { CreateEstablishmentDto, IEstablishment, UpdateEstablishmentDto } from "../types/establishment";

export const getEstablishmentsService = async (): Promise<IEstablishment[]> => {
  const response = await api.get("/establishments");
  return response.data.data;
};

export const getEstablishmentByIdService = async (id: number): Promise<IEstablishment> => {
  const response = await api.get(`/establishments/${id}`);
  return response.data.data;
};

export const createEstablishmentService = async (data: CreateEstablishmentDto): Promise<IEstablishment> => {
  const response = await api.post("/establishments", data);
  return response.data.data;
};

export const updateEstablishmentService = async (id: number, data: UpdateEstablishmentDto): Promise<IEstablishment> => {
  const response = await api.put(`/establishments/${id}`, data);
  return response.data.data;
};

export const deleteEstablishmentService = async (id: number): Promise<void> => {
  await api.delete(`/establishments/${id}`);
};