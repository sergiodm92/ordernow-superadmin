import { Schemas } from "@/types/api";

// The backend's PermissionsController returns the full Permission entity (not a lean DTO) —
// verified against permissions.controller.ts. Only id/name/description are actually read here.
export type PermissionDTO = Schemas["Permission"];
export type CreatePermissionDTO = Schemas["CreatePermissionDto"];
export type UpdatePermissionDTO = Schemas["UpdatePermissionDto"] & { id: string };
