import { useCallback } from "react";
import { toast } from "sonner";
import { useEstablishmentsStore } from "../store/establishments";
import {
  createEstablishmentService,
  deleteEstablishmentService,
  getEstablishmentsService,
  updateEstablishmentService,
} from "../services/establishmentService";
import { CreateEstablishmentDto, UpdateEstablishmentDto } from "../types/establishment";

export const useEstablishments = () => {
  const { establishments, setEstablishments, addEstablishment, updateEstablishment: updateEstablishmentStore, removeEstablishment } = useEstablishmentsStore();

  const fetchEstablishments = useCallback(async () => {
    try {
      const data = await getEstablishmentsService();
      setEstablishments(data);
    } catch (error) {
      toast.error("Error al cargar los establecimientos");
      console.error(error);
    }
  }, [setEstablishments]);

  const createEstablishment = useCallback(async (data: CreateEstablishmentDto) => {
    try {
      const newEstablishment = await createEstablishmentService(data);
      addEstablishment(newEstablishment);
      toast.success("Establecimiento creado exitosamente");
      return newEstablishment;
    } catch (error) {
      toast.error("Error al crear el establecimiento");
      console.error(error);
      throw error;
    }
  }, [addEstablishment]);

  const updateEstablishment = useCallback(async (id: number, data: UpdateEstablishmentDto) => {
    try {
      const updatedEstablishment = await updateEstablishmentService(id, data);
      updateEstablishmentStore(id, updatedEstablishment);
      toast.success("Establecimiento actualizado exitosamente");
      return updatedEstablishment;
    } catch (error) {
      toast.error("Error al actualizar el establecimiento");
      console.error(error);
      throw error;
    }
  }, [updateEstablishmentStore]);

  const deleteEstablishment = useCallback(async (id: number) => {
    try {
      await deleteEstablishmentService(id);
      removeEstablishment(id);
      toast.success("Establecimiento eliminado exitosamente");
    } catch (error) {
      toast.error("Error al eliminar el establecimiento");
      console.error(error);
      throw error;
    }
  }, [removeEstablishment]);

  return {
    establishments,
    fetchEstablishments,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
  };
};