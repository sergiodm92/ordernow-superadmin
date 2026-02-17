'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const useNavigationLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const pathname = usePathname();
  const [previousPathname, setPreviousPathname] = useState(pathname);

  const showLoading = (message: string = 'Cargando...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleStart = (targetPath: string) => {
      timeoutId = setTimeout(() => {
        setIsLoading(true);
        setLoadingMessage(getLoadingMessage(targetPath));
      }, 150);
    };

    const handleComplete = () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:') && !link.href.startsWith('#')) {
        try {
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
            handleStart(url.pathname);
          }
        } catch (error) {
          // Ignorar errores de URL inválidas
        }
      }
    };

    if (pathname !== previousPathname) {
      handleComplete();
      setPreviousPathname(pathname);
    }

    document.addEventListener('click', handleLinkClick);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleLinkClick);
      handleComplete();
    };
  }, [pathname, previousPathname]);

  const getLoadingMessage = (path: string): string => {
    if (path.includes('/dashboard')) return 'Cargando dashboard...';
    if (path.includes('/users')) return 'Cargando usuarios...';
    if (path.includes('/establishments')) return 'Cargando establecimientos...';
    if (path.includes('/roles')) return 'Cargando roles...';
    if (path.includes('/permissions')) return 'Cargando permisos...';
    if (path.includes('/plans')) return 'Cargando planes...';
    if (path.includes('/notifications')) return 'Cargando notificaciones...';
    if (path.includes('/settings')) return 'Cargando configuración...';
    return 'Cargando página...';
  };

  return { isLoading, loadingMessage, showLoading, hideLoading };
};
