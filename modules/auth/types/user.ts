import { Role } from "@/modules/admin/types/role";

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

export interface IEstablishment {
  id: number;
  name: string;
  country: string;
  state: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  userOwnerId: string;
  checkoutMode?: string;
  description?: string;
  website?: string;
  cuisineType?: string;
  capacity?: number;
  openingHours?: string;
  deliveryRadius?: number;
  acceptsReservations?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;
  acceptsCards?: boolean;
}
