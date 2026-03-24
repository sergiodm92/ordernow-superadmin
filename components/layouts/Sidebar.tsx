"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  UserCircle,
  UserPlus,
  Store,
  CreditCard,
  Crown,
  Settings,
  Home,
  Lock,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/store/auth";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/contexts/SidebarContext";

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
  },
  {
    label: "Empleados",
    icon: UserPlus,
    href: "/dashboard/employees",
  },
  {
    label: "Establishments",
    icon: Store,
    href: "/dashboard/establishments",
  },
  {
    label: "Roles",
    icon: UserCircle,
    href: "/dashboard/roles",
  },
  {
    label: "Permissions",
    icon: Lock,
    href: "/dashboard/permissions",
  },
  {
    label: "Plans",
    icon: Crown,
    href: "/dashboard/plans",
  },
  {
    label: "Payment Methods",
    icon: CreditCard,
    href: "/dashboard/payment-methods",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      logout();
      toast.success("Sesión cerrada exitosamente");
      router.push("/login");
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`space-y-4 py-6 flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        {/* Header with Toggle */}
        <div className={`px-6 py-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Super Admin
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <ScrollArea className={`flex-1 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          <div className="space-y-2">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              const buttonContent = (
                <Button
                  key={route.href}
                  asChild
                  variant="ghost"
                  className={`w-full transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 ${
                    isCollapsed ? 'justify-center px-2' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 shadow-sm'
                      : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Link href={route.href} className="flex items-center w-full">
                    <route.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'} ${
                      isActive ? 'text-purple-600 dark:text-purple-400' : ''
                    }`} />
                    {!isCollapsed && <span>{route.label}</span>}
                  </Link>
                </Button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={route.href}>
                    <TooltipTrigger asChild>
                      {buttonContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{route.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </div>
        </ScrollArea>

        {/* Logout Button */}
        <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full h-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Cerrar Sesión</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <div className="mr-3 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Cerrando sesión...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
