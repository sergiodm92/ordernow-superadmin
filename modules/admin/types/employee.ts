export interface IEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  position: string;
  department?: string;
  hireDate?: string;
  isActive: boolean;
  establishmentId: number;
  userId?: string | null;
}
