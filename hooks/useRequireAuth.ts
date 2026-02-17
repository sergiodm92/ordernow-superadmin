import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/modules/auth/store/auth';
import { toast } from 'sonner';

/**
 * Hook que verifica si el usuario tiene rol SUPER_ADMIN
 * y redirige a la página de login si no lo tiene
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasChecked = useRef(false);

  const userId = user?.id;
  const userRoles = user?.roles?.map(r => r.name).join(',');

  // Detectar cuando el store se ha hidratado
  useEffect(() => {
    const authData = localStorage.getItem('auth-storage');

    try {
      if (authData) {
        if (authData.startsWith('[object Object]') || authData === '[object Object]') {
          console.warn('[useRequireAuth] Corrupted localStorage data detected, cleaning up...');
          localStorage.removeItem('auth-storage');
          setHasHydrated(true);
          return;
        }
        JSON.parse(authData);
      }
    } catch (error) {
      console.error('[useRequireAuth] Error parsing localStorage data:', error);
      localStorage.removeItem('auth-storage');
      setHasHydrated(true);
      return;
    }

    if (authData || !localStorage.getItem('auth-storage')) {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (hasChecked.current && isAuthorized) {
      return;
    }

    if (!userId) {
      if (!hasChecked.current) {
        router.push("/login");
        hasChecked.current = true;
      }
      return;
    }

    const isSuperAdmin = userRoles?.includes("ROLE_SUPER_ADMIN");

    if (!isSuperAdmin) {
      if (!hasChecked.current) {
        toast.error("Acceso denegado", {
          description: "No tienes permisos para acceder a esta sección",
        });
        router.push("/login");
        hasChecked.current = true;
      }
      return;
    }

    if (!isAuthorized) {
      setIsAuthorized(true);
      hasChecked.current = true;
    }
  }, [hasHydrated, userId, userRoles, isAuthorized, router]);

  return {
    isAuthorized,
    isLoading: !hasHydrated || !isAuthorized
  };
};
