"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/Overview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Users, Store, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/modules/admin/services/admin.service";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEstablishments: 0,
    totalPaymentMethods: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats({
          totalUsers: data.totalUsers,
          totalEstablishments: data.totalEstablishments,
          totalPaymentMethods: data.totalPaymentMethods
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-green-200/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10 hover:shadow-lg transition-all duration-200 hover:border-green-300/50 dark:hover:border-green-600/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Users</CardTitle>
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalUsers.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-blue-200/50 dark:border-blue-700/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 hover:shadow-lg transition-all duration-200 hover:border-blue-300/50 dark:hover:border-blue-600/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Establishments</CardTitle>
            <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalEstablishments.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-indigo-200/50 dark:border-indigo-700/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 hover:shadow-lg transition-all duration-200 hover:border-indigo-300/50 dark:hover:border-indigo-600/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Payment Methods</CardTitle>
            <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.totalPaymentMethods.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3 border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
