export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  permissions: Permission[];
  level: number;
  createdAt?: string;
  updatedAt?: string;
}

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