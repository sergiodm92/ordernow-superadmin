"use client";

import { Sidebar } from "@/components/layouts/Sidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLoadingStore } from "@/store/loading";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useEffect } from "react";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import { useNotificationPolling } from "@/modules/notifications/hooks/useNotificationPolling";
import { AppProvider } from "@/providers/AppProvider";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useRequireAuth();
  const { showLoading, hideLoading } = useLoadingStore();
  const { isCollapsed } = useSidebar();
  useNotificationPolling();

  useEffect(() => {
    if (isLoading && !isAuthorized) {
      showLoading('Verificando permisos...');
    } else {
      hideLoading();
    }

    return () => {
      if (!isLoading) {
        hideLoading();
      }
    };
  }, [isLoading, isAuthorized, showLoading, hideLoading]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="h-full relative bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className={`hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-r border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 ${
        isCollapsed ? 'md:w-20' : 'md:w-72'
      }`}>
        <Sidebar />
      </div>
      <main className={`transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="flex justify-end p-4 pb-0">
          <NotificationBell />
        </div>
        <div className="p-8 pt-2">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </AppProvider>
  );
}
