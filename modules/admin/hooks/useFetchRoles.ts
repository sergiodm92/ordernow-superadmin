import { useEffect } from "react";
import { getRolesService } from "../services/roleService";
import { useRolesStore } from "../store/roles";

export const useFetchRoles = () => {
  const { setRoles } = useRolesStore();

  useEffect(() => {
    getRolesService()
      .then((response) => {
        setRoles(response);
      })
      .catch((error) => console.error("Error fetching roles:", error));
  }, [setRoles]);
};