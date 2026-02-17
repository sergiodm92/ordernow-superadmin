import { useEffect } from "react";
import { getAllRolesService } from "../services/rolesService";
import { useRolesStore } from "../store/roles";

export const useFetchRoles = () => {
  const { setRoles } = useRolesStore();

  useEffect(() => {
    getAllRolesService()
      .then((response) => {
        setRoles(response);
      })
      .catch((error) => console.error("Error fetching roles:", error));
  }, [setRoles]);
};