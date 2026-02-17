export interface PermissionDTO {
  id: string;
  name: string;
  description: string;
}

export interface CreatePermissionDTO {
  name: string;
  description: string;
}

export interface UpdatePermissionDTO extends CreatePermissionDTO {
  id: string;
}