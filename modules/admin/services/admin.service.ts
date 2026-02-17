import  api  from "@/config/api.axios";

export interface DashboardStats {
  totalUsers: number;
  totalEstablishments: number;
  totalPaymentMethods: number;
  monthlyRevenue: Array<{
    name: string;
    total: number;
  }>;
}

export interface Activity {
  name: string;
  email: string;
  action: string;
  timestamp: string;
}

import { useAuthStore } from "@/modules/auth/store/auth";
import { useUsersStore } from "@/modules/admin/store/user";
import { useEstablishmentsStore } from "../store/establishments";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { totalElements: totalUsers } = useUsersStore.getState();
    const { establishments } = useEstablishmentsStore.getState();

    

    return {
      totalUsers: totalUsers,
      totalEstablishments: establishments.length,
      totalPaymentMethods: 0,
      monthlyRevenue: []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const { totalElements: totalUsers } = useUsersStore.getState();
    const { establishments } = useEstablishmentsStore.getState();
    return {
      totalUsers: totalUsers,
      totalEstablishments: establishments.length,
      totalPaymentMethods: 0,
      monthlyRevenue: []
    };
  }
};

