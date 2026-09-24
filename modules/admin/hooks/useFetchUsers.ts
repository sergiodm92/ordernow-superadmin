import { useEffect, useCallback } from "react";
import { getAllUsersService } from "../services/userService";
import { useUsersStore } from "../store/user";

export const useFetchUsers = (page: number, size: number) => {
  const { setUsers, setTotalElements } = useUsersStore();

  const fetchUsers = useCallback(async () => {
    try {
      // page is 0-based here (matches every caller's UI state); the backend's
      // GET /users/all is 1-based, so page=0 becomes a negative OFFSET and
      // the query fails. Convert at this boundary.
      const response = await getAllUsersService(page + 1, size);
      setUsers(response.data);
      setTotalElements(response.total);
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
