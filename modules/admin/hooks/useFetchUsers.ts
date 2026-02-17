import { useEffect, useCallback } from "react";
import { getAllUsersService } from "../services/userService";
import { useUsersStore } from "../store/user";

export const useFetchUsers = (page: number, size: number) => {
  const { setUsers, setTotalElements } = useUsersStore();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getAllUsersService(page, size);
      setUsers(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error; // Re-lanzar para que el caller pueda manejarlo
    }
  }, [page, size, setUsers, setTotalElements]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { fetchUsers };
};
