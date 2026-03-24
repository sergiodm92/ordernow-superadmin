import { useEffect, useCallback } from "react";
import { getAllEmployeesService } from "../services/employeeService";
import { useEmployeesStore } from "../store/employees";

export const useFetchEmployees = (page: number, size: number) => {
  const { setEmployees, setTotalElements, setTotalPages } = useEmployeesStore();

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getAllEmployeesService(page, size);
      setEmployees(Array.isArray(response.content) ? response.content : []);
      setTotalElements(response.totalElements ?? 0);
      setTotalPages(response.totalPages ?? 0);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [page, size, setEmployees, setTotalElements, setTotalPages]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { fetchEmployees };
};
