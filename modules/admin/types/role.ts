import { Schemas } from "@/types/api";

// Mirrors the backend's Role / Permission entities (GET/POST/PUT /roles).
export type Permission = Schemas["Permission"];
export type Role = Schemas["Role"];

// Frontend-only write shapes: the UI works with a `permissions: string[]` (ids) field and
// roleService.ts remaps it to the backend's `permissionIds` before sending.
export interface CreateRoleDto {
  name: string;
  description: string;
  isDefault?: boolean;
  permissions?: string[];
  level?: number;
}

export interface UpdateRoleDto extends CreateRoleDto {
  id: string;
}
