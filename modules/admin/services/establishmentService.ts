import api from "@/config/api.axios";
import { ApiData } from "@/types/api";
import { CreateEstablishmentDto, IEstablishment, UpdateEstablishmentDto } from "../types/establishment";

// Establishment.id is a Postgres bigint, which the backend serializes as a string.
const toEstablishment = (raw: IEstablishment): IEstablishment => ({
  ...raw,
  id: Number(raw.id),
});

export const getEstablishmentsService = async (): Promise<IEstablishment[]> => {
  const response = await api.get<{ data: ApiData<"/api/v1/establishments", "get"> }>("/establishments");
  return response.data.data.map(toEstablishment);
};

export const getEstablishmentByIdService = async (id: number): Promise<IEstablishment> => {
  const response = await api.get<{ data: ApiData<"/api/v1/establishments/{id}", "get"> }>(`/establishments/${id}`);
  return toEstablishment(response.data.data);
};

export const createEstablishmentService = async (data: CreateEstablishmentDto): Promise<IEstablishment> => {
  const response = await api.post<{ data: ApiData<"/api/v1/establishments", "post"> }>("/establishments", data);
  return toEstablishment(response.data.data);
};

export const updateEstablishmentService = async (id: number, data: UpdateEstablishmentDto): Promise<IEstablishment> => {
  const response = await api.put<{ data: ApiData<"/api/v1/establishments/{id}", "put"> }>(
    `/establishments/${id}`,
    data
  );
  return toEstablishment(response.data.data);
};

export const deleteEstablishmentService = async (id: number): Promise<void> => {
  await api.delete(`/establishments/${id}`);
};
