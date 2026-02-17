'use client';

import { ThemeProvider } from '@/components/common/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import GlobalLoading from '@/components/common/GlobalLoading';
import { useLoadingStore } from '@/store/loading';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useRef(new QueryClient());
  const { showLoading, hideLoading } = useLoadingStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    showLoading('Inicializando aplicación...');
    setIsMounted(true);
  }, [showLoading]);

  useEffect(() => {
    if (isMounted) {
      hideLoading();
    }
  }, [isMounted, hideLoading]);

  if (!isMounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient.current}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <GlobalLoading />
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
