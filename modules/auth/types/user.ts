import { Role } from "@/modules/admin/types/role";
import { Schemas } from "@/types/api";

// Composite FE shape for the logged-in user, built by loginAdminService's mapping of
// AuthResponsePayload (accessToken/refreshToken/user/establishments) — not a 1:1 backend DTO,
// so this stays hand-written (see authService.ts).
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageURL?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  lastLogin?: string;
  roles: Role[];
  createdAt: string;
  establishments?: IEstablishment[];
}

// Mirrors the backend's EstablishmentResponseDto (used for AuthResponse.establishments).
export type IEstablishment = Schemas["EstablishmentResponseDto"];
